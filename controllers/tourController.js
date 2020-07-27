// MODULES
const Tour = require('../models/tourModel');

// 1.) EXPORT ROUTE HANDLERS
exports.getAllTours = async (request, response) => {
  try {
    // BUILDING THE QUERY
    const queryObj = { ...request.query };

    const excludedFields = ['page', 'sort', 'limit', 'fields'];

    excludedFields.forEach((exc) => {
      delete queryObj[exc];
    });

    console.log(request.query, queryObj);

    const query = Tour.find(queryObj);

    // const query = Tour.find()
    //   .where('duration')
    //   .equals(5)
    //   .where('difficulty')
    //   .equals('easy');

    // EXECUTING QUERY
    const tours = await query;

    // SEND RESPONSE
    response.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        tours: tours,
      },
      requestedAt: request.requestTime,
    });
  } catch (error) {
    response.status(404).json({
      status: 'fail',
      message: `not found`,
      requestedAt: request.requestTime,
    });
  }
};

exports.getSpecificTour = async (request, response) => {
  try {
    // const specificTour = await Tour.findOne({ _id: request.params.id });
    const specificTour = await Tour.findById(request.params.id);

    response.status(200).json({
      status: 'success',
      data: {
        tour: specificTour,
      },
      requestedAt: request.requestTime,
    });
  } catch (error) {
    response.status(404).json({
      status: 'fail',
      message: `not found`,
      requestedAt: request.requestTime,
    });
  }
};

exports.createTour = async (request, response) => {
  try {
    // const newTour = new Tour({});
    // newTour.save();
    const newTour = await Tour.create(request.body);

    response.status(201).json({
      status: 'success',
      data: {
        tour: newTour,
      },
      createdAt: request.requestTime,
    });
  } catch (error) {
    response.status(400).json({
      status: 'fail',
      message: `invalid request data`,
      requestedAt: request.requestTime,
    });
  }
};

exports.updateTour = async (request, response) => {
  try {
    const tour = await Tour.findByIdAndUpdate(request.params.id, request.body, {
      new: true,
      runValidators: true,
    });

    response.status(200).json({
      status: 'success',
      data: {
        tour,
      },
      updatedAt: request.requestTime,
    });
  } catch (error) {
    response.status(400).json({
      status: 'fail',
      message: `invalid request data`,
      requestedAt: request.requestTime,
    });
  }
};

exports.deleteTour = async (request, response) => {
  try {
    await Tour.findByIdAndDelete(request.params.id);

    response.status(204).json({
      status: 'success',
      deletedAt: request.requestTime,
    });
  } catch (error) {
    response.status(404).json({
      status: 'fail',
      message: `not found`,
      requestedAt: request.requestTime,
    });
  }
};
