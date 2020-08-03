// MODULES
const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');

// MIDDLEWARE FUNCTIONS
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
      mostrated: {
        sort: '-ratingsQuantity,-ratingsAverage',
        fields: 'name,price,ratingsAverage,ratingsQuantity,summary,difficulty',
      },
      leastrated: {
        sort: 'ratingsQuantity,-ratingsAverage',
        fields: 'name,price,ratingsAverage,ratingsQuantity,summary,difficulty',
      },
    };

    // ROUTE PATH MUTATIONS
    type = type.replace(/(most-rated|most-Rated)/g, 'mostrated');
    type = type.replace(/(least-rated|least-Rated)/g, 'leastrated');
    type = type.toLowerCase();
    // REMOVEMENTS
    type = type.replace(/( |€|£|\$|%|~|@|\^)/g, '');

    request.query.limit = request.params.aliasCount;
    request.query.sort = possibleSortings[type].sort;
    request.query.fields = possibleSortings[type].fields;
  } catch (error) {
    response.status(400).json({
      status: `fail`,
      message: `${error}`,
      requestedAt: request.requestTime,
    });
  }
  next();
};

// 1.) EXPORT ROUTE HANDLERS
exports.getAllTours = async (request, response) => {
  try {
    // PROCESSING QUERY
    const features = new APIFeatures(Tour.find(), request.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const tours = await features.query;

    // SENDING RESPONSE
    response.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        tours: tours,
      },
      timeMilliseconds: tours.queryTime,
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
    const specificTour = await new APIFeatures(Tour.findOne(), {
      _id: request.params.id,
    })
      .filter()
      .limitFields().query;

    response.status(200).json({
      status: 'success',
      data: {
        tour: specificTour,
      },
      timeMilliseconds: specificTour.queryTime,
      requestedAt: request.requestTime,
    });
  } catch (error) {
    response.status(404).json({
      status: 'fail',
      message: error,
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
      timeMilliseconds: newTour.creationTime,
      createdAt: request.requestTime,
    });
  } catch (error) {
    response.status(400).json({
      status: 'fail',
      message: `${error}`,
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

exports.getTourStats = async (request, response) => {
  try {
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4.5 } },
      },
      {
        $group: {
          _id: { $toUpper: '$difficulty' },
          totalTours: { $sum: 1 },
          totalRatings: { $sum: '$ratingsQuantity' },
          avgRating: { $avg: '$ratingsAverage' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
      {
        $sort: { avgPrice: -1 },
      },
      // {
      //   $match: { _id: { $ne: 'EASY' } },
      // },
    ]);

    response.status(200).json({
      status: 'success',
      results: stats.length,
      data: {
        statistics: stats,
      },
      timeMilliseconds: stats.aggregationTime,
      requestedAt: request.requestTime,
    });
  } catch (error) {
    response.status(404).json({
      status: 'fail',
      message: error,
      requestedAt: request.requestTime,
    });
  }
};

exports.getMonthlyPlan = async (request, response) => {
  try {
    const year = request.params.year * 1;

    const plan = await Tour.aggregate([
      {
        $unwind: '$startDates',
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$startDates' },
          numTours: { $sum: 1 },
          tours: {
            $push: {
              name: '$name',
              price: '$price',
              ratingsAverage: '$ratingsAverage',
            },
          },
        },
      },
      {
        $addFields: {
          month: '$_id',
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
      {
        $sort: {
          numTours: -1,
        },
      },
      {
        $limit: 12,
      },
    ]);

    response.status(200).json({
      status: 'success',
      results: plan.length,
      data: {
        AnnualPlan: plan,
      },
      timeMilliseconds: plan.aggregationTime,
      requestedAt: request.requestTime,
    });
  } catch (error) {
    response.status(404).json({
      status: 'fail',
      message: error,
      requestedAt: request.requestTime,
    });
  }
};
