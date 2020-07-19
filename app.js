// MODULES
const fs = require('fs');
const express = require('express');

// EXPRESS
const app = express();
// MIDDLEWARE
app.use(express.json());

// READ TOUR DATA FROM FILE
const tourData = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
);

// CALLBACK FUNCTIONS
const getAllTours = (request, response) => {
  response.status(200).json({
    status: 'success',
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
      message: 'invalid ID',
    });
  } else {
    response.status(200).json({
      status: 'success',
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
          status: 'error',
        });
      response.status(201).json({
        status: 'success',
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
      message: 'invalid ID',
    });
  } else {
    response.status(200).json({
      status: 'success',
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
      message: 'invalid ID',
    });
  } else {
    response.status(204).json({
      status: 'success',
      data: null,
    });
  }
};

// ROUTING
app.route('/api/v1/tours').get(getAllTours).post(createTour);
app
  .route('/api/v1/tours/:id')
  .get(getSpecificTour)
  .patch(updateTour)
  .delete(deleteTour);

// SERVER LISTENING
const port = 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
