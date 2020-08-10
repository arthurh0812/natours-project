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
