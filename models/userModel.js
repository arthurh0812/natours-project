// MODULES
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const state = require('../utils/state');
const AppError = require('../utils/appError');

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
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
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
});

userSchema.pre('save', async function (next) {
  // only run this function if password was modified
  if (!this.isModified('password')) return next();

  // hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // remove passwordConfirm data
  this.passwordConfirm = undefined;
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
