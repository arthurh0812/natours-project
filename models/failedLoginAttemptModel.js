// MODULES
const mongoose = require('mongoose');
// const validator = require('validator');
// const crypto = require('crypto');
// const bcrypt = require('bcryptjs');
// const AppError = require('../utils/appError');

// SCHEMA
const failedLoginAttemptSchema = new mongoose.Schema({
  count: {
    type: Number,
    default: 0,
  },
  client: {
    type: String,
  },
  loginProhibitionTime: {
    type: Date,
  },
});

// DOCUMENT MIDDLEWARE
// before .save(), .create()

failedLoginAttemptSchema.methods.isProhibitedLogin = function () {
  if (this.loginProhibitionTime) {
    const convertedProhibitionTime = parseInt(
      this.loginProhibitionTime.getTime(),
      10
    );
    return Date.now() < convertedProhibitionTime;
  }
  return false;
};

const User = mongoose.model('FailedLoginAttempt', failedLoginAttemptSchema);

module.exports = User;
