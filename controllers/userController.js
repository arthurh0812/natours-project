/* eslint-disable array-callback-return */
// MODULES
const User = require('../models/userModel');
const { catchHandler } = require('../utils/catchFunction');
const AppError = require('../utils/appError');

const filterObj = (obj, ...fields) => {
  const newObject = {};
  Object.keys(obj).forEach((el) => {
    if (fields.includes(el)) newObject[el] = obj[el];
  });
  return newObject;
};

// 1.) EXPORT ROUTE HANDLERS
exports.getAllUsers = catchHandler(async (request, response, next) => {
  // PROCESSING QUERY
  const users = await User.find();

  // SENDING RESPONSE
  response.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users: users,
    },
    timeMilliseconds: users.queryTime,
    requestedAt: request.requestTime,
  });
});

exports.updateMe = catchHandler(async (request, response, next) => {
  // 1) check if user posts password or username data
  if (
    request.body.password ||
    request.body.passwordconfirm ||
    request.body.username
  )
    return next(
      new AppError(
        `This is route is not to change your password or your username. To change your username use a ${
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

  const user = await User.findById(request.user._id);

  // 2) check if user is allowed to change his username
  if (user.checkUsernameChangeProhibition())
    return next(
      new AppError(
        `Please wait until ${new Date(
          user.usernameChangedAt.getTime() + 30 * 24 * 60 * 60 * 1000
        )} to change your username again.`,
        401
      )
    );

  // 3) filter out only the username field to be changed
  const filteredBody = filterObj(request.body, 'username');

  // 4) get user document by id and update the username
  const updatedUser = await User.findByIdAndUpdate(
    request.user._id,
    filteredBody,
    {
      new: true,
      runValidators: true,
    }
  );

  // 5) extend the duration when to again change the username by 30 days
  if (request.user.role !== 'admin') {
    updatedUser.usernameChangedAt = Date.now();
    await updatedUser.save({ validateBeforeSave: false });
  }

  // 6) send the newly updated user to client
  response.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.getSpecificUser = (request, response) => {
  response.status(500).json({
    status: 'error',
    message: 'this route is not yet defined',
  });
};

exports.createUser = (request, response) => {
  response.status(500).json({
    status: 'error',
    message: 'this route is not yet defined',
  });
};

exports.updateUser = (request, response) => {
  response.status(500).json({
    status: 'error',
    message: 'this route is not yet defined',
  });
};

exports.deleteUser = (request, response) => {
  response.status(500).json({
    status: 'error',
    message: 'this route is not yet defined',
  });
};
