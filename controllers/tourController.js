/* eslint-disable array-callback-return */
// MODULES
const Tour = require('../models/tourModel');
const { catchHandler, catchParam } = require('../utils/catchFunction');
const factory = require('./handlerFactory');
const MonthConverter = require('../utils/monthConverter');
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
exports.getAllTours = factory.getAll(Tour);

exports.getSpecificTour = factory.getOne(Tour, { path: 'reviews' });

exports.createTour = factory.createOne(Tour);

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);

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

  plan.forEach((pl) => {
    pl.monthName = new MonthConverter(pl.month).getMonthName();
  });

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

exports.getToursWithin = catchHandler(async (request, response, next) => {
  const { distance, latlng, unit } = request.params;
  const [lat, lng] = latlng.split(',');

  if (!lat || !lng)
    return next(
      new AppError(
        'Please provide your latitude and longitude in the format .../center/<latitude>,<longitude>.',
        400
      )
    );

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  response.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});
