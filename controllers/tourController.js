// MODULES
const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');

// MIDDLEWARE FUNCTION
exports.aliasTopTours = (request, response, next, type) => {
  try {
    const possibleSortings = {
      best: {
        sort: '-ratingsAverage,price',
        fields: 'name,price,ratingsAverage,summary,difficulty',
      },
      cheap: {
        sort: 'price,-ratingsAverage',
        fields: 'name,price,ratingsAverage,summary,difficulty',
      },
      expensive: {
        sort: '-price,-ratingsAverage',
        fields: 'name,price,ratingsAverage,summary,difficulty',
      },
      long: {
        sort: '-duration,-ratingsAverage',
        fields: 'name,price,ratingsAverage,summary,difficulty,duration',
      },
      short: {
        sort: 'duration,-ratingsAverage',
        fields: 'name,price,ratingsAverage,summary,difficulty,duration',
      },
      mostRated: {
        sort: '-ratingsQuantity,-ratingsAverage',
        fields: 'name,price,ratingsAverage,ratingsQuantity,summary,difficulty',
      },
      leastRated: {
        sort: 'ratingsQuantity,-ratingsAverage',
        fields: 'name,price,ratingsAverage,ratingsQuantity,summary,difficulty',
      },
    };

    // ROUTE PATH MUTATIONS
    type = type.replace(/(most-rated|most-Rated)/g, 'mostRated');
    type = type.replace(/(least-rated|least-Rated)/g, 'leastRated');
    // REMOVEMENTS
    type = type.replace(/( |€|£|\$|%|~|@|\^)/g, '');

    request.query.limit = request.params.aliasCount;
    request.query.sort = possibleSortings[type].sort;
    request.query.fields = possibleSortings[type].fields;
  } catch (error) {
    request.query.limit = 1;
  }
  next();
};

// 1.) EXPORT ROUTE HANDLERS
exports.getAllTours = async (request, response) => {
  try {
    const features = new APIFeatures(Tour.find(), request.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // EXECUTING QUERY
    const tours = await features.query;

    // SENDING RESPONSE
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
      message: `${error}`,
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
