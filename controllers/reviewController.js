// MODULES
const Review = require('../models/reviewModel');
const factory = require('./handlerFactory');

// MIDDLEWARE FUNCTIONS
exports.setFilter = (request, response, next) => {
  request.filterObj = {};
  if (request.params.tourId)
    request.filterObj = { tour: request.params.tourId };
  next();
};

exports.setTourUserIds = (request, response, next) => {
  // set the tour and author id
  if (!request.body.tour) request.body.tour = request.params.tourId;
  if (!request.body.author) request.body.author = request.user._id;
  next();
};

// ROUTE HANDLERS
exports.getAllReviews = factory.getAll(Review);

exports.getReview = factory.getOne(Review);

exports.createReview = factory.createOne(Review);

exports.updateReview = factory.updateOne(Review);

exports.deleteReview = factory.deleteOne(Review);
