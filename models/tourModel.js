// MODULES
const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const AppError = require('../utils/appError');

// SCHEMA
const locationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      default: 'Point',
      enum: ['Point'],
    },
    coordinates: [
      {
        type: Number,
        set: (value) => {
          if (Number.isInteger(value)) return value + 0.0001;
          return value;
        },
      },
    ],
    address: String,
    description: {
      type: String,
      required: [true, 'Please name a description for the start location'],
    },
    day: {
      type: Number,
      default: 1,
    },
  },
  {
    _id: false,
  }
);

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
      default: null,
      min: [1, 'Average rating must be greater than or equal to 1'],
      max: [5, 'Average rating cannot be greater than 5'],
      set: (value) => {
        if (!value) return value;
        return Math.round(value * 100) / 100;
      },
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
    images: {
      type: [String],
      validate: {
        validator: function (value) {
          return value.length >= 3;
        },
        message:
          'Please name at least three pictures to let your adventurers get a better idea of your tour',
      },
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    startLocation: {
      type: locationSchema,
      required: [true, 'Each tour must have a starting location'],
    },
    locations: [
      {
        type: locationSchema,
      },
    ],
    guides: [
      {
        type: mongoose.SchemaTypes.ObjectId,
      },
    ],
    secretTour: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: { getters: true, virtuals: true },
    toObject: { getters: true, virtuals: true },
    id: false,
  }
);

// INDEXING
// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

// VIRTUAL PROPERTIES
tourSchema.virtual('durationWeeks').get(function () {
  if (this.duration) return this.duration / 7;
});
// VIRTUAL POPULATE
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// DOCUMENT MIDDLEWARE
// before .save(), .create()
tourSchema.pre('save', function (next) {
  this.startTime = Date.now();
  this.slug = slugify(this.name, { lower: true });
  next();
});
// after .save(), .create()
tourSchema.post('save', function (doc, next) {
  doc.creationTime = Date.now() - this.startTime;
  next();
});

// QUERY MIDDLEWARE
// before .find(), .findOne(), .findById() etc.
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.startTime = Date.now();
  next();
});
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    model: 'User',
    select:
      '-__v -passwordChangedAt -passwordFailures -usernameChangedAt -active -registered',
  });
  next();
});
// after find()
tourSchema.post('find', function (docs, next) {
  docs.queryTime = Date.now() - this.startTime;
  next();
});
// after findOne(), findOneAndUpdate(), findOneAndDelete()
tourSchema.post(/^findOne/, function (doc, next) {
  if (doc) doc.queryTime = Date.now() - this.startTime;
  return next();
});

// AGGREGATION MIDDLEWARE
// before .aggregate()
tourSchema.pre('aggregate', function (next) {
  const matchObject = { $match: { secretTour: { $ne: true } } };
  if (!this.pipeline()[0].$geoNear) this.pipeline().unshift(matchObject);
  else this.pipeline().splice(1, 0, matchObject);
  this.startTime = Date.now();
  next();
});
// after .aggregate()
tourSchema.post('aggregate', function (docs, next) {
  docs.aggregationTime = Date.now() - this.startTime;
  next();
});

// METHODS
tourSchema.statics.checkOwnTour = async function (requestId, userId, next) {
  const tour = await this.findById(requestId);
  if (!tour) return next(new AppError('No document found with that ID.', 404));
  if (tour.guides.find((guide) => guide._id.toString() === userId.toString()))
    return true;
  return false;
};

// MODEL
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
