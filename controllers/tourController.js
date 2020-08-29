/* eslint-disable prefer-const */
/* eslint-disable array-callback-return */
// MODULES
const Tour = require('../models/tourModel');
const { catchHandler, catchParam } = require('../utils/catchFunction');
const factory = require('./handlerFactory');
const MonthConverter = require('../utils/monthConverter');
const AppError = require('../utils/appError');

// POSSIBLE SORTING TYPES
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

// ALLOWED UNITS (based on 1 meter)
const units = {
  mm: 0.0001,
  cm: 0.01,
  dm: 0.1,
  m: 1,
  km: 1000,
  mi: 1609.34709,
  nmi: 1852,
};

// MIDDLEWARE FUNCTIONS
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
exports.setLeadGuide = (request, response, next) => {
  if (!request.body.guides) {
    request.body.guides = [request.user._id];
  } else if (!request.body.guides.includes(request.user._id)) {
    request.body.guides.push(request.user_id);
  }
  next();
};

exports.ownTour = catchHandler(async (request, response, next) => {
  if (request.user.role === 'admin') return next();
  if (!(await Tour.checkOwnTour(request.params.id, request.user._id, next)))
    return next(
      new AppError('You are not permitted to perform this action.', 401)
    );
  next();
});

exports.getAllTours = factory.getAll(Tour);

exports.getSpecificTour = factory.getOne(Tour, { path: 'reviews' });

exports.createTour = factory.createOne(Tour);

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchHandler(async (request, response, next) => {
  const stats = await Tour.aggregate([
    // {
    //   $match: { ratingsAverage: { $gte: 4.5 } },
    // },
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
  let { distance, latlng, unit } = request.params;
  let [lat, lng] = latlng.split(',');
  lat = parseFloat(lat);
  lng = parseFloat(lng);

  if (!(lat && lng))
    return next(
      new AppError(
        'Please provide your latitude and longitude in the format .../center/<latitude>,<longitude>/...',
        400
      )
    );
  if (!unit) unit = 'km';
  else if (units[unit] === undefined)
    return next(new AppError('Please enter a valid unit.', 400));

  const radius = distance / ((6371 * 1000) / units[unit]);

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

exports.getDistances = catchHandler(async (request, response, next) => {
  let { latlng, unit } = request.params;
  let [lat, lng] = latlng.split(',');
  lat = parseFloat(lat);
  lng = parseFloat(lng);

  // check if unit is correct
  if (!unit) unit = 'km';
  else if (units[unit] === undefined)
    return next(new AppError('Please enter a valid unit.', 400));

  const mutiplier = 1 / units[unit];

  if (!(lat && lng))
    return next(
      new AppError(
        'Please provide your latitude and longitude in the format .../distance/<latitude>,<longitude>/...',
        400
      )
    );

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        distanceField: 'distance',
        distanceMultiplier: mutiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
        price: 1,
      },
    },
  ]);

  distances.forEach((el) => {
    el.distance = Math.round(el.distance * 1000) / 1000;
  });

  response.status(200).json({
    status: 'success',
    results: distances.length,
    data: {
      data: distances,
    },
  });
});
