// MODULES
const { catchHandler } = require('../utils/catchFunction');
const Tour = require('../models/tourModel');
const viewFunctions = require('../utils/viewFunctions');

// ROUTE HANDLER
exports.getOverview = catchHandler(async (request, response, next) => {
  // 1) get all tour data from collection
  const tours = await Tour.find();

  // 2) build template
  // 3) render template using tour data
  response.status(200).render('overview', {
    title: 'All Tours',
    tours: tours,
  });
});

exports.getTour = catchHandler(async (request, response, next) => {
  // 1) get the tour by its slug
  const tour = await Tour.findOne({ slug: request.params.tourSlug }).populate({
    path: 'reviews',
    select: 'review rating author',
  });

  const reviews = viewFunctions.getRandomElements(tour.reviews, 15);

  // 2) build the template
  // 3) render template using data
  response.status(200).render('tour', {
    title: tour.name,
    tour: tour,
    reviews: reviews,
  });
});

exports.getSignupForm = catchHandler(async (request, response, next) => {
  // 1) render webpage
  response.status(200).render('signup', {
    title: 'Sign up for free',
  });
});

exports.getLoginForm = catchHandler(async (request, response, next) => {
  // 1) render webpage
  response.status(200).render('login', {
    title: 'Log into your Account',
  });
});
