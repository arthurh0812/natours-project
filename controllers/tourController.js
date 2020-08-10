/* eslint-disable array-callback-return */
// MODULES
const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const { catchHandler, catchParam } = require('../utils/catchFunction');
const AppError = require('../utils/appError');

// MIDDLEWARE FUNCTIONS
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

exports.aliasTopTours = catchParam(async (request, response, next, type) => {
  // ROUTE PATH MUTATIONS
  type = type.replace(/(most-rated|most-Rated)/g, 'mostrated');
  type = type.replace(/(least-rated|least-Rated)/g, 'leastrated');
  type = type.toLowerCase();
  // REMOVEMENTS
  type = type.replace(/( |€|£|\$|%|~|@|\^)/g, '');

  request.query.limit = request.params.aliasCount;
  request.query.sort = possibleSortings[type].sort;
  request.query.fields = possibleSortings[type].fields;
  next();
});

// ROUTE HANDLERS
exports.getAllTours = catchHandler(async (request, response, next) => {
  let flag = true;
  // PROCESSING QUERY
  const tours = await new APIFeatures(
    Tour.find((error, result) => {
      if (error) {
        flag = false;
        next(error);
      }
    }),
    request.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate().query;

  if (!flag) return;

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
});

exports.getSpecificTour = catchHandler(async (request, response, next) => {
  // const specificTour = await Tour.findOne({ _id: request.params.id });
  const specificTour = await Tour.findOne({ _id: request.params.id });

  if (!specificTour) return;

  response.status(200).json({
    status: 'success',
    data: {
      tour: specificTour,
    },
    timeMilliseconds: specificTour.queryTime,
    requestedAt: request.requestTime,
  });
});

exports.createTour = catchHandler(async (request, response, next) => {
  const newTour = await Tour.create(request.body);

  response.status(201).json({
    status: 'success',
    data: {
      tour: newTour,
    },
    timeMilliseconds: newTour.creationTime,
    createdAt: request.requestTime,
  });
});

exports.updateTour = catchHandler(async (request, response, next) => {
  const tour = await Tour.findOneAndUpdate(
    { _id: request.params.id },
    request.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!tour) return;

  response.status(200).json({
    status: 'success',
    data: {
      tour,
    },
    timeMilliseconds: tour.queryTime,
    updatedAt: request.requestTime,
  });
});

exports.deleteTour = catchHandler(async (request, response, next) => {
  const tour = await Tour.findOneAndDelete({ _id: request.params.id });

  if (!tour) return;

  response.status(204).json({
    status: 'success',
    timeMilliseconds: tour.queryTime,
    deletedAt: request.requestTime,
  });
});

exports.getTourStats = catchHandler(async (request, response, next) => {
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
});

exports.getMonthlyPlan = catchHandler(async (request, response, next) => {
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
});
