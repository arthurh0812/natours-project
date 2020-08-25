// CONFIGURATION OF ENVIRONMENT VARIBALES
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

// MODULES
const fs = require('fs');
const mongoose = require('mongoose');
const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');

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

// 1.) CONNECTING TO DATABASE
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

// 2.) READING JSON FILE
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

// 3.) IMPORTING DATA INTO COLLECTION
const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log(`Data successfully loaded!`);
  } catch (error) {
    console.log(`ERROR: ${error}`);
  }
  process.exit();
};

// 4.) DELETING DATA FROM COLLECTION
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log(`Data successfully deleted!`);
  } catch (error) {
    console.log(`ERROR: ${error}`);
  }
  process.exit();
};

// 5.) DECIDING FROM THE ARGUMENTS
if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
