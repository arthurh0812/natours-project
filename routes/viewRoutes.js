// MODULES
const express = require('express');
const authController = require('../controllers/authController');
const viewController = require('../controllers/viewController');

const router = express.Router();

router.use(authController.isLoggedIn);

router.get('/', viewController.getOverview);

router.get('/tour/:tourSlug', viewController.getTour);

router.get('/signup', viewController.getSignupForm);

router.get(
  '/login',
  authController.tooManyFailedAttempts,
  viewController.getLoginForm
);

module.exports = router;
