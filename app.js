// MODULES
const express = require('express');
const morgan = require('morgan');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

// EXPRESS
const app = express();

// 1.) MIDDLEWARES
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());

app.use(express.static(`${__dirname}/public`));

app.use((request, response, next) => {
  request.requestTime = new Date().toISOString();
  next();
});

// 2.) ROUTING
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// 3.) EXPORTING THE EXPRESS APP
module.exports = app;
