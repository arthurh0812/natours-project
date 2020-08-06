const AppError = require('../utils/appError');

const handleCastErrorDB = (error) => {
  const message = `Invalid ${error.path}: ${error.value}.`;
  return new AppError(message, 400);
};

const sendErrorDev = (error, response) => {
  response.status(error.statusCode).json({
    status: error.status,
    error: error,
    message: error.message,
    stack: error.stack,
  });
};

const sendErrorProd = (error, response) => {
  // Operational errors
  if (error.isOperational) {
    response.status(error.statusCode).json({
      status: error.status,
      message: error.message,
    });
  }
  // Programming/other errors: no leak to client
  else {
    // 1.) log error to console
    console.error('ERROR: ', error.name);

    // 2.) send generic response
    response.status(500).json({
      status: `error`,
      message: `Something went wrong...`,
    });
  }
};

module.exports = (error, request, response, next) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, response);
  } else if (process.env.NODE_ENV === 'production') {
    let errorResp = error;
    if (error.name === 'CastError') {
      errorResp = handleCastErrorDB(errorResp);
    }

    sendErrorProd(errorResp, response);
  }
};
