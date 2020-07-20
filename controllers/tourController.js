// MODULES
const fs = require('fs');

// 1.) READ TOUR DATA FROM FILE
const tourData = JSON.parse(
  fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
);

// 2.) EXPORT ROUTE HANDLERS
exports.getAllTours = (request, response) => {
  response.status(200).json({
    status: 'success',
    requestedAt: request.requestTime,
    results: tourData.length,
    data: {
      tours: tourData,
    },
  });
};

exports.getSpecificTour = (request, response) => {
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

exports.createTour = (request, response) => {
  const newID = tourData[tourData.length - 1].id + 1;
  const newTour = Object.assign({ id: newID }, request.body);

  tourData.push(newTour);

  fs.writeFile(
    `${__dirname}/../dev-data/data/tours-simple.json`,
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

exports.updateTour = (request, response) => {
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

exports.deleteTour = (request, response) => {
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
