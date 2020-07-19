const fs = require('fs');
const express = require('express');

const app = express();

app.use(express.json());

const tourData = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
);

app.get('/api/v1/tours', (request, response) => {
  response.status(200).json({
    status: 'success',
    results: tourData.length,
    data: {
      tours: tourData,
    },
  });
});

app.get('/api/v1/tours/:id', (request, response) => {
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
});

app.post('/api/v1/tours', (request, response) => {
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
});

app.patch('/api/v1/tours/:id', (request, response) => {
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
});

app.delete('/api/v1/tours/:id', (request, response) => {
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
});

const port = 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
