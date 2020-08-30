// MODULES
const Review = require('../models/reviewModel');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

// MIDDLEWARE FUNCTIONS
exports.setFilter = (request, response, next) => {
  request.filterObj = {};
  if (request.params.tourId)
    request.filterObj = { tour: request.params.tourId };
  next();
};

exports.setTourAndUserIds = (request, response, next) => {
  // set the tour and author id
  if (!request.body.tour) request.body.tour = request.params.tourId;
  if (!request.body.author) request.body.author = request.user._id;
  next();
};

exports.ownReview = async (request, response, next) => {
  // check if the author of the review is equal to the currently logged in user
  if (!(await Review.checkOwnReview(request.params.id, request.user._id, next)))
    return next(
      new AppError('You are not permitted to perform this action.', 401)
    );
  next();
};

// ROUTE HANDLERS
exports.getAllReviews = factory.getAll(Review);

exports.getReview = factory.getOne(Review);

exports.createReview = factory.createOne(Review);

exports.updateReview = factory.updateOne(Review);

exports.deleteReview = factory.deleteOne(Review);
