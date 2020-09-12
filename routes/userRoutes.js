// MODULES
const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

// 1.) CREATE ROUTER
const router = express.Router();

// 2.) DEFINE AND NAVIGATE TO ROUTES
// AUTHORIZATION
router.post('/signup', authController.signUp);
router.get('/resendEmail', authController.resendEmail);
router.get('/confirmEmail/:token', authController.confirmEmail);
router.post('/login', authController.logIn);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// user has to be logged in for all routes coming after this middleware
router.use(authController.protect);

router.patch('/changeMyPassword', authController.changePassword);

// ME-ROUTES
router.get('/me', userController.getMe, userController.getSpecificUser);
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.delete('/deleteMe', userController.deleteMe);

// DATA ROUTES
// user must be admin to access the routes coming after this middleware
router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route('/:id')
  .get(userController.getSpecificUser)
  .patch(
    authController.controlInput(
      'role',
      'username',
      'photo',
      'active',
      'passwordProhibition'
    ),
    userController.updateUser
  )
  .delete(userController.deleteUser);

// 3.) EXPORT ROUTER
module.exports = router;
