// MODULES
const express = require('express');
const tourController = require('./../controllers/tourController');

// 1.) CREATE ROUTER
const router = express.Router();

// 2.) MIDDLEWARES
router.param('id', tourController.checkID);

// 3.) DEFINE AND NAVIGATE TO ROUTES
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
