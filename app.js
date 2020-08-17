// MODULES
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const AppError = require('./utils/appError');
const state = require('./utils/state');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const User = require('./models/userModel');

// EXPRESS
const app = express();

// remove all unregistered accounts whose confirmation has expired (every 30 min)
async function removeUnregistered() {
  await User.deleteMany({ emailConfirmationExpires: { $lte: Date.now() } });
  setTimeout(removeUnregistered, 30 * 60 * 1000);
}
removeUnregistered();

// 1.) GLOBAL MIDDLEWARES

// set security HTTP headers
app.use(helmet());
// log the whole request (development)
if (process.env.NOD_ENV === 'development') {
  app.use(morgan('dev'));
}
// limit requests coming from the same IP
const limiter = rateLimit({
  max: 150,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests. Please try again in an hour.',
});
app.use('/api', limiter);
// parse and read data from the body
app.use(express.json({ limit: '10kb' }));
// serving static files
app.use(express.static(`${__dirname}/public`));
// individual middleware
app.use((request, response, next) => {
  // reset state for checking if there was already an error
  state.alreadyError = false;
  // set time as a property of request
  request.requestTime = new Date().toISOString();
  next();
});

// 2.) ROUTING
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// all other invalid routes
app.all('*', (request, response, next) => {
  // const error = new Error(
  //   `Could not find ${request.originalUrl} on this server!`
  // );
  // error.status = 'fail';
  // error.statusCode = 404;

  next(
    new AppError(`Could not find ${request.originalUrl} on this server!`, 404)
  );
});

app.use(globalErrorHandler);

// 3.) EXPORTING THE EXPRESS APP
module.exports = app;
