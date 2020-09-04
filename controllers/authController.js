// MODULES
const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const FailedLoginAttempt = require('../models/failedLoginAttemptModel');
const User = require('../models/userModel');
const sendEmail = require('../utils/email');
const AppError = require('../utils/appError');
const { catchHandler } = require('../utils/catchFunction');

const signWebToken = (value) => {
  return jwt.sign({ id: value }, process.env.JWT_SECRETKEY, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createAndSendAuthToken = (statusCode, user, response) => {
  const token = signWebToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    secure: true,
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'development') cookieOptions.secure = false;

  response.cookie('auth', token, cookieOptions);

  // don't show password in output
  if (user.password) user.password = undefined;

  response.status(statusCode).json({
    status: 'success',
    token: token,
    data: {
      user: user,
    },
  });
};

exports.signUp = catchHandler(async (request, response, next) => {
  // 1) get data from request body
  const { name, username, email, password, passwordConfirm } = request.body;

  // 2) create user by that data
  const newUser = await User.create({
    name: name,
    username: username,
    email: email,
    password: password,
    passwordConfirm: passwordConfirm,
    registered: false,
  });

  // 3) generate random confirmation token
  const confirmationToken = newUser.createEmailConfirmationToken();
  await newUser.save({ validateBeforeSave: false });

  // 4) define the confirmation URL by the confirmation token and the message
  const confirmationURL = `${request.protocol}://${request.get(
    'host'
  )}/api/v1/users/confirmEmail/${confirmationToken}`;

  const message = `To confirm that you have access to the email address you specified at NATOURS, please click on this link: ${confirmationURL}.\nIf you haven't registered at NATOURS, please just ignore this email!`;

  // 5) send email with that message
  try {
    await sendEmail({
      email: newUser.email,
      subject:
        'Email Confirmation of Your Account at NATOURS (expires in 30 minutes)',
      message: message,
    });

    response.status(200).json({
      status: 'success',
      message:
        'We sent a link to your email address in order to register your account. Please check your email inbox!',
    });
  } catch (error) {
    newUser.emailConfirmationToken = undefined;
    newUser.emailConfirmationExpires = undefined;
    await newUser.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'An error occurred while sending the email. Please try again later.',
        500
      )
    );
  }
});

exports.confirmEmail = catchHandler(async (request, response, next) => {
  // 1) encrypt token of URL parameters
  const confirmationToken = crypto
    .createHash('sha256')
    .update(request.params.token)
    .digest('hex');

  // 2) get user based on encrypted token
  const user = await User.findOne({
    emailConfirmationToken: confirmationToken,
    emailConfirmationExpires: { $gte: Date.now() },
  });

  // 3) check if there is such a user
  if (!user)
    return next(new AppError('Token is either invalid or has expired.', 400));

  // 4) remove the passwordResetToken and its expiring date and set the user's active status to true
  user.registered = true;
  user.emailConfirmationToken = undefined;
  user.emailConfirmationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  // 5) send JWT to client
  createAndSendAuthToken(201, user, response);
});

exports.logIn = catchHandler(async (request, response, next) => {
  // login prohibition function
  const prohibitLogin = (failedAttempt) =>
    next(
      new AppError(
        `You had too many incorrect password attempts. Please wait until ${failedAttempt.loginProhibitionTime} to login again.`,
        401
      )
    );

  let fail = await FailedLoginAttempt.findOne({
    client: request.ipInfo.ip,
  });

  if (fail && fail.isProhibitedLogin()) {
    return prohibitLogin(fail);
  }

  const { username, email, password } = request.body;

  // 1) check if username && password || email && password are given
  if (!((username || email) && password)) {
    return next(
      new AppError(
        'Please provide your email or your username and a password',
        400
      )
    );
  }

  // 2) check if user exists
  const user = await User.findOne({
    $or: [{ email: email }, { username: username }],
  }).select('+password +passwordFailures +passwordProhibition');

  if (!user)
    return next(new AppError('Incorrect username or email or password.', 401));

  // 4) check if given password is correct
  if (!(await user.correctPassword(password, user.password))) {
    if (!fail)
      fail = new FailedLoginAttempt({
        count: 1,
        client: request.ipInfo.ip,
      });
    else {
      fail.count += 1;
    }
    // set the prohibition time acording to count
    if (fail.count >= 10) {
      // 8 hours
      fail.loginProhibitionTime = Date.now() + 8 * 60 * 60 * 1000;
    } else if (fail.count === 9) {
      // 4 hours
      fail.loginProhibitionTime = Date.now() + 4 * 60 * 60 * 1000;
    } else if (fail.count === 8) {
      // 4 hours
      fail.loginProhibitionTime = Date.now() + 2 * 60 * 60 * 1000;
    } else if (fail.count === 7) {
      // 4 hours
      fail.loginProhibitionTime = Date.now() + 1 * 60 * 60 * 1000;
    } else if (fail.count === 6) {
      // 4 hours
      fail.loginProhibitionTime = Date.now() + (1 / 2) * 60 * 60 * 1000;
    }

    // save changes
    await fail.save();

    return next(new AppError('Incorrect username or email or password', 401));
  }

  // 7) if password was correct, reset failure count and remove prohibition time
  fail.count = 0;
  fail.loginProhibitionTime = undefined;
  await fail.save();

  // 8) if everything is ok, send token to client
  createAndSendAuthToken(200, user, response);
});

exports.forgotPassword = catchHandler(async (request, response, next) => {
  // 1) check if an email is specified
  if (!request.body.email)
    return next(new AppError('Please name your email address.', 400));

  // 2) get user by email and check if there is one
  const user = await User.findOne({ email: request.body.email });

  if (!user)
    return next(new AppError('No user found with that email address.', 404));

  // 3) generate random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 4) send it to user's email
  const resetURL = `${request.protocol}://${request.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and confirm the new password to: ${resetURL}.\nIf you haven't requested to reset your password, please just ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your Password Reset at NATOURS (expires in 10 minutes)',
      message: message,
    });

    response.status(200).json({
      status: 'success',
      message: 'Token was sent to your email',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passworResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'An error occurred while sending the email. Please try again later.',
        500
      )
    );
  }
});

exports.resetPassword = catchHandler(async (request, response, next) => {
  // 1) encrypt token from URL parameters
  const encryptedToken = crypto
    .createHash('sha256')
    .update(request.params.token)
    .digest('hex');

  // 2) get user by encrypted token
  const user = await User.findOne({
    passwordResetToken: encryptedToken,
    passwordResetExpires: { $gte: Date.now() },
  });

  // 2) if there is a user and his token has not expired, set new password
  if (!user) return next(new AppError('Token is invalid or has expired', 400));
  user.password = request.body.password;
  user.passwordConfirm = request.body.passwordConfirm;
  // 3) remove the passwordResetToken and its expiring date
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 4) log user in and send JWT to client
  createAndSendAuthToken(200, user, response);
});

exports.changePassword = catchHandler(async (request, response, next) => {
  // 1) get user by token (findByIdAndUpdate() would not work as it doesn't keep object in memory and so the validator will not have access to 'this')
  const user = await User.findById(request.user._id).select('+password');

  // 2) check if POSTed password is correct
  if (
    !(await user.correctPassword(request.body.currentPassword, user.password))
  )
    return next(new AppError('The password is not correct.', 401));

  // 3) update password
  user.password = request.body.newPassword;
  user.passwordConfirm = request.body.newPasswordConfirm;
  await user.save();

  // 4) log user in, send JWT
  createAndSendAuthToken(200, user, response);
});

exports.protect = catchHandler(async (request, response, next) => {
  // 1) get JSON web token and check if it exists
  let token;
  if (
    request.headers.authorization &&
    request.headers.authorization.startsWith('Bearer')
  ) {
    token = request.headers.authorization.split(' ')[1];
  } else if (request.cookies.auth) {
    token = request.cookies.auth;
  }

  if (!token) return next(new AppError('You are not logged in!', 401));

  // 2) token verification
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRETKEY);

  // 3) check if user still exists
  const currentUser = await User.findById(decoded.id);

  if (!currentUser)
    return next(
      new AppError('User belonging to the token no longer exists.', 401)
    );

  // 4) check if user changed password after token was issued
  if (currentUser.changedPasswordAfter(decoded.iat * 1000))
    return next(
      new AppError('User changed password. Please login again.', 401)
    );

  // 5) grant access to protected route
  request.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (request, response, next) => {
    // roles is an array
    if (!roles.includes(request.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action.', 403)
      );
    }
    next();
  };
};

// (only for rendered pages, no errors!)
exports.isLoggedIn = catchHandler(async (request, response, next) => {
  if (request.cookies.auth) {
    // 1) token verification
    const decoded = await promisify(jwt.verify)(
      request.cookies.auth,
      process.env.JWT_SECRETKEY
    );

    // 2) check if user still exists
    const currentUser = await User.findById(decoded.id);

    if (!currentUser) return next();

    // 4) check if user changed password after token was issued
    if (currentUser.changedPasswordAfter(decoded.iat * 1000)) return next();

    // 5) there is a logged in user
    response.locals.user = currentUser;
  }
  next();
});
// (only for rendered pages, no errors!)
exports.tooManyFailedAttempts = catchHandler(
  async (request, response, next) => {
    const fail = await FailedLoginAttempt.findOne({
      client: request.ipInfo.ip,
    });

    if (fail && fail.isProhibitedLogin()) {
      response.locals.loginProhibition = fail;
    }
    next();
  }
);

exports.controlInput = (...inputFields) => {
  return (request, response, next) => {
    Object.keys(request.body).forEach((key) => {
      if (!inputFields.includes(key)) delete request.body[key];
    });
    next();
  };
};
