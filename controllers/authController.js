// MODULES
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const { catchHandler } = require('../utils/catchFunction');

const signWebToken = (ID) => {
  return jwt.sign({ id: ID }, process.env.JWT_SECRETKEY, {
    expiresIn: process.env.JWT_EXPIRES_IN,
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

  const token = signWebToken(newUser._id);

  response.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser,
    },
  });
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
  const token = signWebToken(user._id);

  response.status(200).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
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
  if (currentUser.changedPasswordAfter(decoded.iat))
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
