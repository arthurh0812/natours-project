// MODULES
const Review = require('../models/reviewModel');
// const APIFeatures = require('../utils/apiFeatures');
const { catchHandler, catchParam } = require('../utils/catchFunction');

exports.getAllReviews = catchHandler(async (request, response, next) => {
  const reviews = await Review.find();

  response.status(200).json({
    status: 'sucess',
    results: reviews.length,
    data: {
      reviews: reviews,
    },
  });
});

exports.createReview = catchHandler(async (request, response, next) => {
  const newReview = await Review.create(request.body);

  response.status(201).json({
    status: 'success',
    data: {
      review: newReview,
    },
  });
});
