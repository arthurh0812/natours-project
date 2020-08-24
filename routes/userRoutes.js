// MODULES
const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

// 1.) CREATE ROUTER
const router = express.Router();

// 2.) DEFINE AND NAVIGATE TO ROUTES
// AUTHORIZATION
router.post('/signup', authController.signUp);
router.get('/confirmEmail/:token', authController.confirmEmail);
router.post('/login', authController.logIn);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);
router.patch(
  '/changeMyPassword',
  authController.protect,
  authController.changePassword
);
router.patch(
  '/changeMyUsername',
  authController.protect,
  userController.changeUsername
);
// ME-ROUTES
router.get(
  '/me',
  authController.protect,
  userController.getMe,
  userController.getSpecificUser
);
router.patch('/updateMe', authController.protect, userController.updateMe);
router.delete('/deleteMe', authController.protect, userController.deleteMe);
// DATA ROUTES
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
