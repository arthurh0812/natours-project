// MODULES
const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

// ROUTER
const router = express.Router({ mergeParams: true });

// ROUTES
// user has to be logged in to access the routes coming after this middleware
router.use(authController.protect);
// user can only pass in the review field, the rating field and the tour field
router.use(authController.controlInput('review', 'rating', 'tour'));

router
  .route('/')
  .get(reviewController.setFilter, reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setTourAndUserIds,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.ownReview,
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.ownReview,
    reviewController.deleteReview
  );

// 3.) EXPORT ROUTER
module.exports = router;
