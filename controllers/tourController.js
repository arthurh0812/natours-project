// MODULES
const Tour = require('../models/tourModel');

// 1.) EXPORT ROUTE HANDLERS
exports.getAllTours = (request, response) => {
  response.status(200).json({
    status: 'success',
    requestedAt: request.requestTime,
  });
};

exports.getSpecificTour = (request, response) => {
  response.status(200).json({
    status: 'success',
    requestedAt: request.requestTime,
  });
};

exports.createTour = (request, response) => {
  response.status(201).json({
    status: 'success',
    createdAt: request.requestTime,
  });
};

exports.updateTour = (request, response) => {
  response.status(200).json({
    status: 'success',
    updatedAt: request.requestTime,
  });
};

exports.deleteTour = (request, response) => {
  response.status(204).json({
    status: 'success',
    deletedAt: request.requestTime,
    data: null,
  });
};
