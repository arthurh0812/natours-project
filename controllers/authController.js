// MODULES
const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const sendEmail = require('../utils/email');
const AppError = require('../utils/appError');
const { catchHandler } = require('../utils/catchFunction');

const signWebToken = (ID) => {
  return jwt.sign({ id: ID }, process.env.JWT_SECRETKEY, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createAndSendWebToken = (statusCode, user, response) => {
  const token = signWebToken(user._id);

  response.status(statusCode).json({
    status: 'success',
    token: token,
    data: {
      user: user,
    },
  });
};

exports.signUp = catchHandler(async (request, response, next) => {
  const newUser = await User.create({
    name: request.body.name,
    username: request.body.username,
    email: request.body.email,
    password: request.body.password,
    passwordConfirm: request.body.passwordConfirm,
  });

  createAndSendWebToken(201, newUser, response);
});

exports.logIn = catchHandler(async (request, response, next) => {
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

  // 2) check if user exists && password matches
  const user = await User.findOne({
    $or: [{ email: email }, { username: username }],
  }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password)))
    return next(new AppError('Incorrect username or email or password', 401));

  // 3) if everything is ok, send token to client
  createAndSendWebToken(200, user, response);
});

exports.forgotPassword = catchHandler(async (request, response, next) => {
  // 1) get user by email
  const user = await User.findOne({ email: request.body.email });

  if (!user)
    return next(new AppError('No user found with that email address.', 404));

  // 2) generate random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) send it to user's email
  const resetURL = `${request.protocol}://${request.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and confirm the new password to: ${resetURL}.\nIf you haven't requested to reset your password, please just ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your Password Reset Token (expires in 10 minutes)',
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
  // 1) get user by token
  const encryptedToken = crypto
    .createHash('sha256')
    .update(request.params.token)
    .digest('hex');

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
  createAndSendWebToken(200, user, response);
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
  createAndSendWebToken(200, user, response);
});

exports.protect = catchHandler(async (request, response, next) => {
  // 1) get JSON web token and check if it exists
  let token;
  if (
    request.headers.authorization &&
    request.headers.authorization.startsWith('Bearer')
  ) {
    token = request.headers.authorization.split(' ')[1];
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
