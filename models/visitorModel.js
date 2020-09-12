// MODULES
const mongoose = require('mongoose');

// SCHEMA
const visitorSchema = new mongoose.Schema(
  {
    ipAddress: {
      $type: String,
    },
    timesVisited: {
      $type: Number,
      default: 0,
    },
    failedLoginAttempts: {
      $type: Number,
      default: 0,
    },
    loginProhibitionTime: {
      $type: Date,
    },
  },
  {
    typeKey: '$type',
  }
);

visitorSchema.methods.isProhibitedLogin = function () {
  if (this.loginProhibitionTime) {
    const convertedProhibitionTime = parseInt(
      this.loginProhibitionTime.getTime(),
      10
    );
    return Date.now() < convertedProhibitionTime;
  }
  return false;
};

const Visitor = mongoose.model('Visitor', visitorSchema);

module.exports = Visitor;
