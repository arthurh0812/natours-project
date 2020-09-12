// MODULES
const express = require('express');
const authController = require('../controllers/authController');
const viewController = require('../controllers/viewController');

const router = express.Router();

router.use(async (request, response, next) => {
  request.visitor.timesVisited += 1;
  await request.visitor.save();
  next();
});

router.get('/', authController.isLoggedIn, viewController.getOverview);

router.get(
  '/tour/:tourSlug',
  authController.isLoggedIn,
  viewController.getTour
);

router.get('/signup', authController.isLoggedIn, viewController.getSignupForm);

router.get('/confirmMyEmail/:token', viewController.confirmMyEmail);

router.get(
  '/login',
  authController.isLoggedIn,
  authController.tooManyFailedAttempts,
  viewController.getLoginForm
);

router.get('/me', authController.isLoggedIn, viewController.getAccount);

router.post(
  '/submit-user-data',
  authController.protect,
  viewController.updateUserData
);

module.exports = router;
