/* eslint-disable array-callback-return */
// MODULES
const User = require('../models/userModel');
const { catchHandler } = require('../utils/catchFunction');

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
