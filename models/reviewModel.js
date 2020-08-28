// MODULES
const mongoose = require('mongoose');
// const slugify = require('slugify');
// const validator = require('validator');
const Tour = require('./tourModel');
// const state = require('../utils/state');
// const MonthConverter = require('../utils/monthConverter');
const AppError = require('../utils/appError');

// SCHEMA
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review must have a text'],
    },
    rating: {
      type: Number,
      min: [1, 'Rating cannot be less than 1'],
      max: [5, 'Rating cannot be greater than 5'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.SchemaTypes.ObjectId,
      required: [true, 'Review must belong to a tour'],
    },
    author: {
      type: mongoose.SchemaTypes.ObjectId,
      required: [true, 'Review must have an author'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    id: false,
  }
);

// INDEXING
reviewSchema.index({ tour: 1, author: 1 }, { unique: true });

// QUERY MIDDLEWARE
// before find
reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name',
  // }).populate({
  //   path: 'author',
  //   select: 'name photo',
  // });
  this.populate({
    path: 'author',
    model: 'User',
    select: 'username photo',
  });
  next();
});

reviewSchema.post(/save|^findOneAnd/, async function (doc, next) {
  if (!doc) return next();
  // doc points to saved review, and its constructor is the model
  await doc.constructor.calculateAverageRatings(doc.tour);
  next();
});

reviewSchema.statics.calculateAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        numberRatings: { $sum: 1 },
        averageRating: { $avg: '$rating' },
      },
    },
  ]);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: stats[0].averageRating,
      ratingsQuantity: stats[0].numberRatings,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: null,
      ratingsQuantity: 0,
    });
  }
};

reviewSchema.statics.checkOwnReview = async function (requestId, userId, next) {
  const review = await this.findById(requestId);
  if (!review)
    return next(new AppError('No document found with that ID.', 404));
  if (review.author._id.toString() === userId.toString()) return true;
  return false;
};

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
