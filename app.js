// MODULES
const fs = require('fs');
const express = require('express');
const morgan = require('morgan');

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

// READ TOUR DATA FROM FILE
const tourData = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
);

// 2.) ROUTE HANDLERS
const getAllTours = (request, response) => {
  response.status(200).json({
    status: 'success',
    requestedAt: request.requestTime,
    results: tourData.length,
    data: {
      tours: tourData,
    },
  });
};

const getSpecificTour = (request, response) => {
  const ID = request.params.id * 1;
  const tour = tourData.find((tour) => tour.id === ID);

  if (!tour) {
    response.status(404).json({
      status: 'fail',
      requestedAt: request.requestTime,
      message: 'invalid ID',
    });
  } else {
    response.status(200).json({
      status: 'success',
      requestedAt: request.requestTime,
      data: {
        tour,
      },
    });
  }
};

const createTour = (request, response) => {
  const newID = tourData[tourData.length - 1].id + 1;
  const newTour = Object.assign({ id: newID }, request.body);

  tourData.push(newTour);

  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tourData),
    (error) => {
      if (error)
        return response.status(404).json({
          status: 'fail',
          requestedAt: request.requestTime,
          message: 'invalid ID',
        });
      response.status(201).json({
        status: 'success',
        createdAt: request.requestTime,
        data: {
          tour: newTour,
        },
      });
    }
  );
};

const updateTour = (request, response) => {
  const ID = request.params.id * 1;
  const tour = tourData.find((tour) => tour.id === ID);

  if (!tour) {
    response.status(404).json({
      status: 'fail',
      requestedAt: request.requestTime,
      message: 'invalid ID',
    });
  } else {
    response.status(200).json({
      status: 'success',
      updatedAt: request.requestTime,
      data: {
        tour,
      },
    });
  }
};

const deleteTour = (request, response) => {
  const ID = request.params.id * 1;
  const tour = tourData.find((tour) => tour.id === ID);

  if (!tour) {
    response.status(404).json({
      status: 'fail',
      requestedAt: request.requestTime,
      message: 'invalid ID',
    });
  } else {
    response.status(204).json({
      status: 'success',
      deletedAt: request.requestTime,
      data: null,
    });
  }
};

// 3.) ROUTING
app.route('/api/v1/tours').get(getAllTours).post(createTour);
app
  .route('/api/v1/tours/:id')
  .get(getSpecificTour)
  .patch(updateTour)
  .delete(deleteTour);

// 4.) START SERVER
const port = 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
