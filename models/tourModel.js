// MODULES
const mongoose = require('mongoose');

// SCHEMA
const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: [true, 'Each tour must have a name'],
    unique: true,
  },
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
  },
  ratingsAverage: {
    type: Number,
    default: 4.5,
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
  },
  startDates: [Date],
});

// MODEL
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
