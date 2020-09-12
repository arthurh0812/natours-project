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

// const handleGeoExtractionErrorDB = (error) => {
//   const message = `You have to specify the coordinates of the starting location.`;
//   return new AppError(message, 400);
// };

const handleValidationErrorDB = (error) => {
  const errors = Object.values(error.errors).map((el) => el.message);

  const message = `Invalid input data. ${errors.join(`. `)}`;
  return new AppError(message, 400);
};

const handleJWTVerificationError = () =>
  new AppError(`Invalid token. Please login again.`, 401);

const handleJWTExpiredError = () =>
  new AppError(`Your token session has expired. Please login again.`, 401);

// A) render JSON for /api/...
const sendBackendErrorDev = (error, request, response) => {
  console.log(error);
  return response.status(error.statusCode).json({
    status: error.status,
    error: error,
    message: error.message,
    stack: error.stack,
  });
};

const sendBackendErrorProd = (error, request, response) => {
  // Operational errors
  if (error.isOperational) {
    return response.status(error.statusCode).json({
      status: error.status,
      message: error.message,
    });
  }
  // Programming/other errors
  console.error('ERROR: ', error);
  // generic response
  return response.status(500).json({
    status: 'error',
    message: 'Something went wrong...',
  });
};

// B) render ERROR PAGE
const sendFrontendErrorDev = (error, request, response) => {
  console.log('ERROR', error);
  return response.status(error.statusCode).render('error', {
    title: 'Something went wrong...',
    msg: error.message,
  });
};

const sendFrontendErrorProd = (error, request, response) => {
  // Operational errors
  if (error.isOperational) {
    return response.status(error.statusCode).render('error', {
      title: 'Something went wrong...',
      msg: error.message,
    });
  }
  // Programming/other errors
  console.error('ERROR: ', error);
  // generic response
  return response.status(500).render('error', {
    title: 'Something went wrong...',
    msg: 'We will check what was wrong. Please try again later.',
  });
};

// error handlers
exports.backendErrorHandler = (error, request, response, next) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';

  if (process.env.NODE_ENV === 'development' && !state.alreadyError) {
    sendBackendErrorDev(error, request, response);
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
    // GEOSPATIAL EXTRACTION ERROR
    // else if (error.code === 16755) {
    //   errorResp = handleGeoExtractionErrorDB(error);
    // }
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
    sendBackendErrorProd(errorResp, request, response);
  }
  state.alreadyError = true;
};

exports.frontendErrorHandler = (error, request, response, next) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';

  if (process.env.NODE_ENV === 'development' && !state.alreadyError) {
    sendFrontendErrorDev(error, request, response);
  } else if (process.env.NODE_ENV === 'production' && !state.alreadyError) {
    const errorResp = error;
    sendFrontendErrorProd(errorResp, request, response);
  }
  state.alreadyError = true;
};
