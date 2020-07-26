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

// 2.) STARTING SERVER
const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
