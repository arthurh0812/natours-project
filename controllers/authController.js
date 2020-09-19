// MODULES
const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Email = require('../utils/email');
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
    accounts: [request.visitor._id],
    registered: false,
  });

  // 3) generate random confirmation token
  const confirmationToken = newUser.createEmailConfirmationToken();
  await newUser.save({ validateBeforeSave: false });

  // 4) define the confirmation URL by the confirmation token and the message
  const confirmationUrl = `${request.protocol}://${request.get(
    'host'
  )}/confirmMyEmail/${confirmationToken}`;

  // 5) use Email constructor to create and send corresponding email
  await new Email(newUser, {
    confirmationUrl: confirmationUrl,
  }).sendWelcome();

  // 6) send response to client
  response.status(200).json({
    status: 'success',
    message:
      'We sent you an email in order to verify your email. Please check your email inbox!',
  });
});

exports.resendEmail = catchHandler(async (request, response, next) => {
  // find user by visitor
  const newUser = await User.findOne({
    registered: false,
    accounts: request.visitor._id,
  });

  if (!newUser)
    return next(
      new AppError('It seems you have not created any new account', 404)
    );

  // 2) create new confirmation token
  const confirmationToken = newUser.createEmailConfirmationToken();
  await newUser.save({ validateBeforeSave: false });

  // 3) define email verfication url
  const confirmationUrl = `${request.protocol}://${request.get(
    'host'
  )}/confirmMyEmail/${confirmationToken}`;

  // 4) use Email constructor to create and send corresponding email
  await new Email(newUser, {
    confirmationUrl: confirmationUrl,
  }).sendResendEmail();

  // 5) send response to client
  response.status(200).json({
    status: 'success',
    message:
      'We resent an email in order to verify your email. Please check your email inbox!',
  });
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

  if (user.newEmail) user.email = user.newEmail;
  await user.save({ validateBeforeSave: false });

  // 5) send JWT to client
  createAndSendAuthToken(201, user, response);
});

exports.logIn = catchHandler(async (request, response, next) => {
  // login prohibition function
  const prohibitLogin = (visitor) =>
    next(
      new AppError(
        `You had too many incorrect signin attempts. Please wait until ${new Date(
          visitor.loginProhibitionTime
        ).toLocaleString({ month: 'short', year: 'numeric' })} to login again.`,
        401
      )
    );

  if (request.visitor && request.visitor.isProhibitedLogin()) {
    return prohibitLogin(request.visitor);
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
    request.visitor.failedLoginAttempts += 1;
    // set the prohibition time acording to count
    if (request.visitor.failedLoginAttempts >= 10) {
      // 8 hours
      request.visitor.loginProhibitionTime = Date.now() + 8 * 60 * 60 * 1000;
    } else if (request.visitor.failedLoginAttempts === 9) {
      // 4 hours
      request.visitor.loginProhibitionTime = Date.now() + 4 * 60 * 60 * 1000;
    } else if (request.visitor.failedLoginAttempts === 8) {
      // 2 hours
      request.visitor.loginProhibitionTime = Date.now() + 2 * 60 * 60 * 1000;
    } else if (request.visitor.failedLoginAttempts === 7) {
      // 1 hours
      request.visitor.loginProhibitionTime = Date.now() + 1 * 60 * 60 * 1000;
    } else if (request.visitor.failedLoginAttempts === 6) {
      // 1/2 hours
      request.visitor.loginProhibitionTime =
        Date.now() + (1 / 2) * 60 * 60 * 1000;
    }

    // save changes
    await request.visitor.save();

    // prohibit user from logging in directly at 6th fail
    if (request.visitor.failedLoginAttempts >= 6) {
      return prohibitLogin(request.visitor);
    }

    return next(new AppError('Incorrect username or email or password', 401));
  }

  // 7) if password was correct, reset failure count and remove prohibition time
  request.visitor.failedLoginAttempts = 0;
  request.visitor.loginProhibitionTime = undefined;
  await request.visitor.save();

  // 8) if everything is ok, send token to client
  createAndSendAuthToken(200, user, response);
});

exports.logout = (request, response) => {
  response.cookie('auth', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  response.status(200).json({
    status: 'success',
  });
};

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

  // 4) create reset url containing the reset token
  const resetUrl = `${request.protocol}://${request.get(
    'host'
  )}/resetMyPassword/${resetToken}`;

  // 5) send it to user's email
  await new Email(user, {
    resetPasswordUrl: resetUrl,
  }).sendResetPassword();

  // 6) send response to client
  response.status(200).json({
    status: 'success',
    message: 'Token was sent to your email',
  });
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
  request.user.select('+password');

  // 2) check if POSTed password is correct
  if (
    !(await request.user.correctPassword(
      request.body.currentPassword,
      request.user.password
    ))
  )
    return next(new AppError('The password is not correct.', 401));

  // 3) update password
  request.user.password = request.body.newPassword;
  request.user.passwordConfirm = request.body.newPasswordConfirm;
  await request.user.save({ validateModifiedOnly: true });

  // 4) log user in, send JWT
  createAndSendAuthToken(200, request.user, response);
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
  response.locals.user = currentUser;
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
exports.isLoggedIn = async (request, response, next) => {
  if (request.cookies.auth) {
    try {
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
    } catch (error) {
      return next();
    }
  }
  next();
};
// (only for rendered pages, no errors!)
exports.tooManyFailedAttempts = catchHandler(
  async (request, response, next) => {
    const { visitor } = request;

    if (visitor && visitor.isProhibitedLogin()) {
      return next(
        new AppError(
          `You had too many incorrect signin attempts. Please wait until ${new Date(
            visitor.loginProhibitionTime
          ).toLocaleString({
            month: 'short',
            year: 'numeric',
          })} to login again.`,
          401
        )
      );
    }
    next();
  }
);

exports.controlInput = (...fields) => {
  return (request, response, next) => {
    const newObject = {};
    Object.keys(request.body).forEach((el) => {
      if (fields.includes(el)) newObject[el] = request.body[el];
    });
    return newObject;
  };
};
