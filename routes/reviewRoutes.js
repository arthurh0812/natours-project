// MODULES
const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

// 1.) CREATE ROUTER
const router = express.Router({ mergeParams: true });

// ROUTES
router
  .route('/')
  .get(
    authController.protect,
    reviewController.setFilter,
    reviewController.getAllReviews
  )
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(authController.protect, reviewController.getReview)
  .patch(authController.protect, reviewController.updateReview)
  .delete(authController.protect, reviewController.deleteReview);

// 3.) EXPORT ROUTER
module.exports = router;
