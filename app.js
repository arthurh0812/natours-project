// MODULES
const express = require('express');
const morgan = require('morgan');

const AppError = require('./utils/appError');
const state = require('./utils/state');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

// EXPRESS
const app = express();

// 1.) MIDDLEWARES
if (process.env.NOD_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());

app.use(express.static(`${__dirname}/public`));

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
