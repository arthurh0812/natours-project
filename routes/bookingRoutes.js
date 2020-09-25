// MODULES
const express = require('express');
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

// ROUTER
const router = express.Router();

// ROUTES
router
  .route('/')
  .post(authController.protect, bookingController.getPaymentIntent);

router.route('/webhook').post(bookingController.webhook);

// 3.) EXPORT ROUTER
module.exports = router;
