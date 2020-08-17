// MODULES
const AppError = require('../utils/appError');
const state = require('../utils/state');

const handleCastErrorDB = (error) => {
  const message = `Invalid ${error.path}: ${JSON.stringify(error.value)}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsErrorDB = (error) => {
  const object = error.message.match(/{([^}]+)}/)[0];
  const message = `Duplicate field value: ${object}. Please use another value.`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (error) => {
  const errors = Object.values(error.errors).map((el) => el.message);

  const message = `Invalid input data. ${errors.join(`. `)}`;
  return new AppError(message, 400);
};

const handleJWTVerificationError = () =>
  new AppError(`Invalid token. Please login again.`, 401);

const handleJWTExpiredError = () =>
  new AppError(`Your token session has expired. Please login again.`, 401);

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
    console.error('ERROR: ', error);

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

  if (process.env.NODE_ENV === 'development' && !state.alreadyError) {
    sendErrorDev(error, response);
  } else if (process.env.NODE_ENV === 'production' && !state.alreadyError) {
    let errorResp;
    // CAST ERROR
    if (error.name === 'CastError') {
      errorResp = handleCastErrorDB(error);
    }
    // DUPLICATE FIELDS ERROR
    else if (error.code === 11000) {
      errorResp = handleDuplicateFieldsErrorDB(error);
    }
    // VALIDATION ERROR
    else if (error.name === 'ValidationError') {
      errorResp = handleValidationErrorDB(error);
    }
    // JSON WEB TOKEN VERIFICATION ERROR
    else if (error.name === 'JsonWebTokenError') {
      errorResp = handleJWTVerificationError();
    }
    // JSON WEB TOKEN EXPIRED ERROR
    else if (error.name === 'TokenExpiredError') {
      errorResp = handleJWTExpiredError();
    }
    // ALL OTHER ERRORS
    else {
      errorResp = error;
    }

    sendErrorProd(errorResp, response);
  }
  state.alreadyError = true;
};
