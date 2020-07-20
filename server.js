// CONFIGURATION OF ENVIRONMENT VARIBALES
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

// MODULES
const app = require('./app');

// 1.) STARTING SERVER
const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
