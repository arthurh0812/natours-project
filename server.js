// CONFIGURATION OF ENVIRONMENT VARIBALES
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

// MODULES
const mongoose = require('mongoose');
const app = require('./app');

process.on('uncaughtException', (error) => {
  console.log('UNCAUGHT EXCEPTION: Shutting down...');
  console.log(error.name, error.message);
  process.exit(1);
});

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
const mongoDBConnectionOptions = {
  useUnifiedTopology: false,
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
};

if (process.env.NODE_ENV === 'production')
  mongoDBConnectionOptions.autoIndex = false;

mongoose
  .connect(DBConnetionString, mongoDBConnectionOptions)
  .then(() => console.log(`DB connection succesful!`));

// 2.) STARTING SERVER
const port = process.env.PORT || 8000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// Error Handler for Unhandled Rejections
process.on('unhandledRejection', (error) => {
  console.log('UNHANDLED REJECTION: Shutting down...');
  console.log(error);
  server.close(() => {
    process.exit(1);
  });
});
