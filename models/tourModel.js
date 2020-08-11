// MODULES
const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const state = require('../utils/state');
const MonthConverter = require('../utils/monthConverter');
const AppError = require('../utils/appError');

// SCHEMA
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: [40, 'A tour must have less than or equal to 40 characters'],
      minlength: [8, 'A tour must have more than or equal to 8 characters'],
      required: [true, 'Each tour must have a name'],
      unique: true,
      validate: {
        validator: function (value) {
          return validator.isAlpha(value.split(' ').join(''));
        },
        message: 'Each tour name must only contain characters',
      },
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'Each tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'Each tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'Each tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: "Possible difficulties: 'easy', 'medium' or 'difficult'",
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Average rating must be greater than or equal to 1'],
      max: [5, 'Average rating cannot be greater than 5'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'Each tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (value) {
          // this keyword points only for created documents to the document itself
          return value < this.price;
        },
        message:
          'The price discount ({VALUE}) cannot be greater than or equal to the regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'Each tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'Each tour must have an image cover'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// VIRTUAL PROPERTIES
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// DOCUMENT MIDDLEWARE: runs before/after .save() and .create() (but not for .update())
// before
tourSchema.pre('save', function (next) {
  this.startTime = Date.now();
  this.slug = slugify(this.name, { lower: true });
  next();
});
// after
tourSchema.post('save', function (doc, next) {
  doc.creationTime = Date.now() - this.startTime;
  next();
});

// QUERY MIDDLEWARE: runs before/after .find(), findOne() etc.
// before
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });

  this.startTime = Date.now();
  next();
});

// after find()
tourSchema.post('find', function (docs, next) {
  if (docs) docs.queryTime = Date.now() - this.startTime;
  return next();
});
// after findOne(), findOneAndUpdate(), findOneAndDelete()
tourSchema.post(/^findOne/, function (doc, next) {
  if (!doc && !state.alreadyError)
    return next(new AppError('No tour found with that ID', 404));
  doc.queryTime = Date.now() - this.startTime;
  return next();
});

// AGGREGATION MIDDLEWARE: runs before/after .aggregate()
// before
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

  this.startTime = Date.now();
  next();
});
// after
tourSchema.post('aggregate', function (docs, next) {
  docs.forEach((doc) => {
    if (doc.month) doc.monthName = new MonthConverter(doc.month).getMonthName();
  });

  docs.aggregationTime = Date.now() - this.startTime;
  next();
});

// MODEL
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
