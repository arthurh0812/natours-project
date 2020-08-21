// MODULES
const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

// 1.) CREATE ROUTER
const router = express.Router();

// ROUTES
router
  .route('/')
  .get(authController.protect, reviewController.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.createReview
  );

// 3.) EXPORT ROUTER
module.exports = router;
