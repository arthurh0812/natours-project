// MODULES
const path = require('path');
const express = require('express');
const expressip = require('express-ip');
const morgan = require('morgan');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const state = require('./utils/state');
const {
  backendErrorHandler,
  frontendErrorHandler,
} = require('./controllers/errorController');
const reviewRouter = require('./routes/reviewRoutes');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const viewRouter = require('./routes/viewRoutes');
const Visitor = require('./models/visitorModel');
const User = require('./models/userModel');

// EXPRESS
const app = express();

// defining the view engine (pug)
app.set('view engine', 'pug');
// defining path to views
app.set('views', path.join(__dirname, 'views'));

// remove all unregistered accounts whose confirmation has expired (every 30 min)
async function removeUnregistered() {
  await User.deleteMany({ emailConfirmationExpires: { $lte: Date.now() } });
  setTimeout(removeUnregistered, 30 * 60 * 1000);
}
removeUnregistered();

// 1.) GLOBAL MIDDLEWARES
// serving static files
app.use(express.static(path.join(__dirname, 'public')));

// set security HTTP headers
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [
        "'self'",
        'http://127.0.0.1:3000',
        'https://*.mapbox.com',
        'https://*.stripe.com',
      ],
      baseUri: ["'self'"],
      fontSrc: ["'self'", 'https:', 'data:'],
      scriptSrc: [
        "'self'",
        "'unsafe-eval'",
        'https://cdnjs.cloudflare.com',
        'https://api.mapbox.com',
        'https://js.stripe.com',
      ],
      scriptSrcAttr: "'none'",
      imgSrc: ["'self'", 'data:'],
      frameSrc: ["'self'", 'https://*.stripe.com'],
      objectSrc: ["'none'"],
      styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
      upgradeInsecureRequests: [],
      connectSrc: [
        "'self'",
        'ws://127.0.0.1:8080',
        'http://127.0.0.1:3000',
        'https://*.mapbox.com',
        'https://*.stripe.com',
      ],
    },
  })
);

// log the whole request (development)
if (process.env.NODE_ENV === 'development') {
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
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// data sanitization against NoSQL query injection
app.use(mongoSanitize());

// data sanitization against XSS attacks
app.use(xss());

// prevent HTTP parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'price',
      'ratingsAverage',
      'ratingsQuantity',
      'difficulty',
      'name',
      'maxGroupSize',
    ],
  })
);
// getting the users IP address
app.use(expressip().getIpInfoMiddleware);

// individual middleware
app.use((request, response, next) => {
  // reset state for checking if there was already an error
  state.alreadyError = false;
  // set time as a property of request
  request.requestTime = new Date().toISOString();
  // response.header('Access-Control-Allow-Origin', 'http://127.0.0.1:3000');
  next();
});

// get the visitor by IP address
app.use(async (request, response, next) => {
  let visitor = await Visitor.findOne({ ipAddress: request.ip });

  if (!visitor) {
    visitor = await Visitor.create({
      ipAddress: request.ip,
      timesVisited: 0,
    });
  }

  request.visitor = visitor;
  next();
});

// 2.) ROUTING
app.use('/', viewRouter);
app.use(frontendErrorHandler);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use(backendErrorHandler);

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

// 3.) EXPORTING THE EXPRESS APP
module.exports = app;
