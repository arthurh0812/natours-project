// MODULES
const express = require('express');
const userController = require('./../controllers/userController');

// 1.) CREATE ROUTER
const router = express.Router();

// 2.) DEFINE AND NAVIGATE TO ROUTES
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
