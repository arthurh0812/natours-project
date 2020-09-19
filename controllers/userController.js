/* eslint-disable array-callback-return */
// MODULES
const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userModel');
const Email = require('../utils/email');
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

  // 2) photo
  if (request.file) {
    // 1) set the user's photo property to the filename
    request.user.photo = request.file.filename;
  }

  // 3) email
  if (request.body.email && request.body.email !== request.user.email) {
    // 1) set user's newEmail property
    request.user.newEmail = request.body.email;

    // 2) validate given email
    await request.user.save({ validateModifiedOnly: true });

    // 3) create email confirmationtoken and expiration on user
    const token = request.user.createEmailConfirmationToken();

    // 4) send email with token
    const confirmationUrl = `${request.protocol}://${request.get(
      'host'
    )}/confirmMyEmail/${token}`;

    await new Email(request.user, {
      confirmationUrl: confirmationUrl,
    }).sendResetEmail();
  }

  // 4) name
  if (request.body.name && request.body.name !== request.user.name) {
    // 1) set the user's name property
    request.user.name = request.body.name;
  }

  // 5) username
  if (
    request.body.username &&
    request.body.username !== request.user.username
  ) {
    // 1) check if user is allowed to change his username again
    if (request.user.checkUsernameChangeProhibition())
      return next(
        new AppError(
          `Please wait until ${new Date(
            request.user.usernameChangedAt.getTime() + 30 * 24 * 60 * 60 * 1000
          )} to change your username again.`,
          401
        )
      );

    // 2) set the user's usernameChangedAt and username properties
    request.user.usernameChangedAt = Date.now();
    request.user.username = request.body.username;
  }

  // 6) validate modified fields and save document
  await request.user.save({ validateModifiedOnly: true });

  // 7) send response with updated user data
  response.status(200).json({
    status: 'success',
    data: {
      user: request.user,
    },
  });
});

exports.deleteMe = catchHandler(async (request, response, next) => {
  // 1) set the active property to false
  request.user.active = false;
  await request.user.save({ validateModifiedOnly: true });

  response.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getAllUsers = factory.getAll(User);

exports.getSpecificUser = factory.getOne(User);

exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);
