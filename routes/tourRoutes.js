// MODULES
const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

// 1) CREATE ROUTER
const router = express.Router();

// MIDDLEWARE
router.param('aliasType', tourController.aliasTopTours);

// 2) DEFINE AND NAVIGATE TO ROUTES
// CONNECTED ROUTERS
router.use('/:tourId/reviews', reviewRouter);
// ALIASING
router
  .route('/top-:aliasCount-:aliasType')
  .get(authController.protect, tourController.getAllTours);
// AGGREGATED DOCUMENTS
router
  .route('/stats')
  .get(
    authController.protect,
    authController.restrictTo('admin'),
    tourController.getTourStats
  );
router
  .route('/monthly-plan/:year')
  .get(authController.protect, tourController.getMonthlyPlan);
// ROUTES
router
  .route('/')
  .get(authController.protect, tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );
router
  .route('/:id')
  .get(tourController.getSpecificTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

// 3) EXPORT ROUTER
module.exports = router;
