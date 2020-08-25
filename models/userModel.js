// MODULES
const mongoose = require('mongoose');
const validator = require('validator');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
// const AppError = require('../utils/appError');

// SCHEMA
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your real name'],
    },
    username: {
      type: String,
      required: [true, 'Please provide your username'],
      unique: true,
    },
    usernameChangedAt: {
      type: Date,
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
    emailConfirmationToken: {
      type: String,
    },
    emailConfirmationExpires: {
      type: Date,
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
      minlength: [8, 'Your password must at least be 8 characters long'],
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
        message:
          'The confirmation password has to be the equal to your password',
      },
    },
    passwordChangedAt: {
      type: Date,
    },
    passwordFailures: {
      type: Number,
      default: 0,
      select: false,
    },
    passwordProhibition: {
      type: Date,
      select: false,
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
    },
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    registered: {
      type: Boolean,
      select: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    id: false,
  }
);

// DOCUMENT MIDDLEWARE
// before .save(), .create()
userSchema.pre('save', async function (next) {
  // only run this function if password was modified
  if (!this.isModified('password')) return next();

  // hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // remove passwordConfirm data
  this.passwordConfirm = undefined;

  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// QUERY MIDDLEWARE
// before .find(), .findOne(), .findById() etc.
userSchema.pre(/^find/, function (next) {
  this.find({
    secretTour: { $ne: true },
    active: { $ne: false },
  });
  this.startTime = Date.now();
  next();
});
// after .find()
userSchema.post('find', function (docs, next) {
  docs.queryTime = Date.now() - this.startTime;
  next();
});
// after .findOneAndUpdate(), .findOneAndDelete()
userSchema.post(/^findOne/, function (doc, next) {
  if (doc) doc.queryTime = Date.now() - this.startTime;
  return next();
});

// SCHEMA METHODS
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.tooManyFailedAttempts = function (failedAttemptCount) {
  return this.passwordFailures >= failedAttemptCount;
};

userSchema.methods.isProhibitedLogin = function () {
  if (this.passwordProhibition) {
    const convertedProhibitionTime = parseInt(
      this.passwordProhibition.getTime(),
      10
    );
    return Date.now() < convertedProhibitionTime;
  }
  return false;
};

userSchema.methods.checkUsernameChangeProhibition = function () {
  if (this.usernameChangedAt) {
    const convertedProhibitionTime = parseInt(
      this.usernameChangedAt.getTime() + 30 * 24 * 60 * 60 * 1000,
      10
    );

    return Date.now() < convertedProhibitionTime;
  }

  return false;
};

userSchema.methods.changedPasswordAfter = function (jwtTimestamp) {
  // if there was a password change at all
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime(), 10);

    // if the time the password was changed is after the time the current token was initiated return true otherwise return false
    return jwtTimestamp < changedTimestamp;
  }
  // no change: return false
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // expires in 10 minutes from now
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

userSchema.methods.createEmailConfirmationToken = function () {
  const confirmationToken = crypto.randomBytes(32).toString('hex');

  this.emailConfirmationToken = crypto
    .createHash('sha256')
    .update(confirmationToken)
    .digest('hex');

  // expires in 30 minutes from now
  this.emailConfirmationExpires = Date.now() + 30 * 60 * 1000;

  return confirmationToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
