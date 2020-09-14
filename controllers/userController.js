/* eslint-disable array-callback-return */
// MODULES
const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const { catchHandler } = require('../utils/catchFunction');
const factory = require('./handlerFactory');

// FUNCTIONS
// const multerStorage = multer.diskStorage({
//   destination: (request, file, cbfn) => {
//     cbfn(null, 'public/img/users');
//   },
//   filename: (request, file, cbfn) => {
//     x
//     cbfn(null, `user-${request.user._id}-${Date.now()}.${ext}`);
//   },
// });
const multerStorage = multer.memoryStorage();

const multerFilter = (request, file, cbfn) => {
  if (file.mimetype.startsWith('image')) {
    cbfn(null, true);
  } else {
    cbfn(
      new AppError('Photo is not an image. Please only upload images.', 400),
      false
    );
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

const filterObj = (obj, ...fields) => {
  const newObject = {};
  Object.keys(obj).forEach((el) => {
    if (fields.includes(el)) newObject[el] = obj[el];
  });
  return newObject;
};

// MIDDLEWARE
exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchHandler(async (request, response, next) => {
  if (!request.file) return next();

  if (!request.user.photo.startsWith('default'))
    fs.unlink(`public/img/users/${request.user.photo}`, (error) => {
      if (error) console.log('Error:', error);
    });

  request.file.filename = `user-${request.user._id}-${Date.now()}.jpeg`;

  await sharp(request.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${request.file.filename}`);

  next();
});

// ROUTE HANDLERS
exports.createUser = (request, response, next) => {
  next(new AppError(`This route doesn't exist. Please use /signup!`, 400));
};

exports.getMe = (request, response, next) => {
  request.params.id = request.user._id;
  next();
};

exports.updateMe = catchHandler(async (request, response, next) => {
  // 1) check if user posts password data
  if (request.body.password || request.body.passwordconfirm)
    return next(
      new AppError(
        `This is route is not to change your password. To change your password use ${
          request.protocol
        }://${request.get('host')}/api/v1/users/changeMyPassword`,
        400
      )
    );

  // 2) filter out unwanted fields that are not allowed to be updated by the user
  const filteredBody = filterObj(request.body, 'name', 'email');
  if (request.file) filteredBody.photo = request.file.filename;

  // 3) update user document
  const updatedUser = await User.findByIdAndUpdate(
    request.user._id,
    filteredBody,
    { new: true, runValidators: true }
  );

  // 4) update username if given and allowed
  if (request.body.username && updatedUser.username !== request.body.username) {
    if (updatedUser.checkUsernameChangeProhibition())
      return next(
        new AppError(
          `Please wait until ${new Date(
            updatedUser.usernameChangedAt.getTime() + 30 * 24 * 60 * 60 * 1000
          )} to change your username again.`,
          401
        )
      );

    updatedUser.usernameChangedAt = Date.now();
    updatedUser.save({ validateBeforeSave: false });
  }

  // 5) send response with updated user data
  response.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
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
