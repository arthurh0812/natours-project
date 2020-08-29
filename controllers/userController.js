/* eslint-disable array-callback-return */
// MODULES
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const { catchHandler } = require('../utils/catchFunction');
const factory = require('./handlerFactory');

// FUNCTIONS
const filterObj = (obj, ...fields) => {
  const newObject = {};
  Object.keys(obj).forEach((el) => {
    if (fields.includes(el)) newObject[el] = obj[el];
  });
  return newObject;
};

// ROUTE HANDLERS
exports.createUser = (request, response, next) => {
  next(new AppError(`This route doesn't exist. Please use /signup!`, 400));
};

exports.getMe = (request, response, next) => {
  request.params.id = request.user._id;
  next();
};

exports.updateMe = catchHandler(async (request, response, next) => {
  // 1) check if user posts password or username data
  if (
    request.body.password ||
    request.body.passwordconfirm ||
    request.body.username
  )
    return next(
      new AppError(
        `This is route is not to change your password or your username. To change your username use ${
          request.protocol
        }://${request.get(
          'host'
        )}/api/v1/users/changeMyUsername, to change your password use ${
          request.protocol
        }://${request.get('host')}/api/v1/users/changeMyPassword`,
        400
      )
    );

  // 2) filter out unwanted fields that are not allowed to be updated by the user
  const filteredBody = filterObj(request.body, 'name', 'email');

  // 3) update user document
  const updatedUser = await User.findByIdAndUpdate(
    request.user._id,
    filteredBody,
    { new: true, runValidators: true }
  );

  response.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.changeUsername = catchHandler(async (request, response, next) => {
  // 1) check if a username is specified
  if (!request.body.username)
    return next(new AppError('Please name your new username.', 400));

  // 2) get user by id and check if there is one
  const user = await User.findOne({ _id: request.user._id });

  if (!user)
    return next(
      new AppError('It seems you are not logged in. Please log in again!')
    );

  // 3) check if user is allowed to change his username
  if (user.checkUsernameChangeProhibition())
    return next(
      new AppError(
        `Please wait until ${new Date(
          user.usernameChangedAt.getTime() + 30 * 24 * 60 * 60 * 1000
        )} to change your username again.`,
        401
      )
    );

  // 4) update the username
  const newObj = await User.findByIdAndUpdate(
    request.user._id,
    { username: request.body.username },
    { new: true, runValidators: true }
  );
  // 5) extend the duration when to again change the username by 30 days
  if (request.user.role !== 'admin') {
    user.usernameChangedAt = Date.now();
    user.save({ validateBeforeSave: false });
  }

  // 6) send the newly updated user to client
  response.status(200).json({
    status: 'success',
    data: {
      user: newObj,
    },
  });
});

exports.deleteMe = catchHandler(async (request, response, next) => {
  // 1) get the user by id and set the active property to false
  await User.findByIdAndUpdate(request.user._id, { active: false });

  response.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getAllUsers = factory.getAll(User);

exports.getSpecificUser = factory.getOne(User);

exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);
