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
router.route('/top-:aliasCount-:aliasType').get(tourController.getAllTours);
// AGGREGATED DOCUMENTS
router.route('/stats').get(tourController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

// ROUTES
// user can only pass in these fields
router.use(
  authController.controlInput(
    'startLocation',
    'images',
    'startDates',
    'name',
    'duration',
    'maxGroupSize',
    'difficulty',
    'price',
    'summary',
    'description',
    'imageCover',
    'locations'
  )
);
router
  .route('/')
  .get(tourController.getAllTours)
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
