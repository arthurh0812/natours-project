// MODULES
const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

// 1.) CREATE ROUTER
const router = express.Router();

// 2.) DEFINE AND NAVIGATE TO ROUTES
router.post('/signup', authController.signUp);
router.post('/login', authController.logIn);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);
router.patch(
  '/changeMyPassword',
  authController.protect,
  authController.changePassword
);

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route('/:id')
  .get(userController.getSpecificUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

// 3.) EXPORT ROUTER
module.exports = router;
