const User = require('../models/userModel');
const { catchHandler } = require('../utils/catchFunction');

exports.signUp = catchHandler(async (request, response, next) => {
  const newUser = await User.create(request.body);

  response.status(201).json({
    status: 'success',
    data: {
      user: newUser,
    },
  });
});
