// MODULES
const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

// 1.) CREATE ROUTER
const router = express.Router({ mergeParams: true });

// ROUTES
router
  .route('/')
  .get(authController.protect, reviewController.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.createReview
  );

router
  .route('/:id')
  .delete(
    authController.protect,
    authController.restrictTo('admin'),
    reviewController.deleteReview
  );

// 3.) EXPORT ROUTER
module.exports = router;
