// MODULES
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const AppError = require('../utils/appError');
const state = require('../utils/state');

// SCHEMA
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your real name'],
  },
  username: {
    type: String,
    required: [true, 'Please provide your username'],
    unique: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: {
      validator: validator.isEmail,
      message: 'Please provide a valid email',
    },
  },
  photo: {
    type: String,
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // THIS ONLY WORKS ON .create() OR ON .save()
      validator: function (toConfirmPassword) {
        return toConfirmPassword === this.password;
      },
      message: 'The confirmation password has to be the equal to your password',
    },
  },
  passwordChangedAt: {
    type: Date,
  },
});

// DOCUMENT MIDDLEWARE
// before .save()
userSchema.pre('save', async function (next) {
  // only run this function if password was modified
  if (!this.isModified('password')) return next();

  // hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // remove passwordConfirm data
  this.passwordConfirm = undefined;
  next();
});

// QUERY MIDDLEWARE
// before .find(), .findOne(), .findById() etc.
userSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.startTime = Date.now();
  return next();
});
// after .find()
userSchema.post('find', function (docs, next) {
  docs.queryTime = Date.now() - this.startTime;
  return next();
});

// after .findOneAndUpdate(), .findOneAndDelete()
userSchema.post(/^findOneAnd/, function (doc, next) {
  if (!doc && !state.alreadyError)
    return next(new AppError('No user found with that ID', 404));
  doc.queryTime = Date.now() - this.startTime;
  return next();
});

// SCHEMA METHODS
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (jwtTimestamp) {
  // if there was a password change at all
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    // if the time the password was changed is after the time the current token was initiated return true otherwise return false
    return jwtTimestamp < changedTimestamp;
  }
  // no change: return false
  return false;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
