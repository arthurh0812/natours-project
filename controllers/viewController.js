// MODULES
const { catchHandler } = require('../utils/catchFunction');
const Tour = require('../models/tourModel');
const viewFunctions = require('../utils/viewFunctions');
const AppError = require('../utils/appError');
const User = require('../models/userModel');

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

  if (!tour) return next(new AppError('This tour does not exist.', 404));

  const reviews = viewFunctions.getRandomElements(tour.reviews, 15);

  // 2) build the template
  // 3) render template using data
  response.status(200).render('tour', {
    title: tour.name,
    tour: tour,
    reviews: reviews,
  });
});

exports.getSignupForm = (request, response) => {
  // 1) render webpage
  response.status(200).render('signup', {
    title: 'Sign up for free',
  });
};

exports.confirmMyEmail = (request, response) => {
  response.status(200).render('confirmEmail', {
    title: 'Confirm my Email',
    token: request.params.token,
  });
};

exports.getLoginForm = (request, response) => {
  response.status(200).render('login', {
    title: 'Log into your Account',
  });
};

exports.getAccount = (request, response, next) => {
  if (!response.locals.user)
    return next(
      new AppError('It seems you are not logged in. Please sign in again!', 401)
    );

  response.status(200).render('account', {
    title: 'Your Account',
  });
};

exports.updateUserData = async (request, response) => {
  const user = await User.findById(request.user._id);

  response.status(200).render('account', {
    title: 'Account',
    user: user,
  });
};

exports.getResetPasswordForm = (request, response) => {
  response.status(200).render('resetPassword', {
    title: 'Reset your Password',
  });
};

exports.paymentIntent = async (request, response, next) => {
  const tour = await Tour.findById(request.params.tourId);

  if (!tour)
    return next(
      new AppError("Sorry! We coudn't find a tour with that ID.", 404)
    );

  response.status(200).render('payment', {
    title: 'Book this Tour?',
    tourId: tour._id,
    price: tour.price,
  });
};
