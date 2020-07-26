// CONFIGURATION OF ENVIRONMENT VARIBALES
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

// MODULES
const mongoose = require('mongoose');
const app = require('./app');

let DBConnetionString = process.env.DATABASE.replace(
  '<USERNAME>',
  process.env.DATABASE_USERNAME
);
DBConnetionString = DBConnetionString.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
DBConnetionString = DBConnetionString.replace(
  '<NAME>',
  process.env.DATABASE_NAME
);

mongoose
  .connect(DBConnetionString, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log(`DB connection succesful!`))
  .catch((error) => {
    console.log(`Error: ${error}`);
  });

const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A tour must have a name'],
    unique: true,
  },
  rating: {
    type: Number,
    default: 4.5,
  },
  price: {
    type: Number,
    required: [true, 'A tour must have a price'],
  },
});

const Tour = mongoose.model('Tour', tourSchema);

const testTour = new Tour({
  name: 'The Park Camper',
  price: 497,
});

testTour
  .save()
  .then((doc) => {
    console.log(doc);
  })
  .catch((error) => {
    console.log(error);
  });

// 1.) STARTING SERVER
const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
