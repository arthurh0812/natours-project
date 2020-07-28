// MODULES
const express = require('express');
const tourController = require('../controllers/tourController');

// 1.) CREATE ROUTER
const router = express.Router();

// MIDDLEWARE
router.param('aliasType', tourController.aliasTopTours);

// 2.) DEFINE AND NAVIGATE TO ROUTES
// ALIASING
router.route('/top-:aliasCount-:aliasType').get(tourController.getAllTours);
// ROUTES
router
  .route('/')
  .get(tourController.getAllTours)
  .post(tourController.createTour);
router
  .route('/:id')
  .get(tourController.getSpecificTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

// 3.) EXPORT ROUTER
module.exports = router;
