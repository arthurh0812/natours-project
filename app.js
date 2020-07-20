// MODULES
const express = require('express');
const morgan = require('morgan');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

// EXPRESS
const app = express();

// 1.) MIDDLEWARES
app.use(morgan('dev'));

app.use(express.json());

app.use((request, response, next) => {
  console.log('Hello from the middleware!');
  next();
});

app.use((request, response, next) => {
  request.requestTime = new Date().toISOString();
  next();
});

// 2.) ROUTING
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// 3.) EXPORTING THE EXPRESS APP
module.exports = app;
