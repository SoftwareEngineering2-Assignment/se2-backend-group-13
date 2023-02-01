// imports
// path helps with directories
const path = require('path');
require('dotenv').config({path: path.join(__dirname, '../', '.env')});
// express helps create an app
const express = require('express');
// logger middleware
const logger = require('morgan');
// parsing middleware
const bodyParser = require('body-parser');
// headers
const helmet = require('helmet');
// compression middleware
const compression = require('compression');
// connect/express
const cors = require('cors');
// the module we created
const {error} = require('./middlewares');
const routes = require('./routes');
const {mongoose} = require('./config');
// express initialization
const app = express();
// apply the imported modules
app.use(cors());
app.use(helmet());
// App configuration
app.use(compression());

// development mode if not test mode
if (process.env.NODE_ENV !== 'test') {
  app.use(logger('dev'));
}

// set a limit of 50mb to the request bodies
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: false}));

// Mongo configuration
mongoose();

// Routes
app.use('/', routes);

// Server static files
app.use(express.static(path.join(__dirname, 'assets')));

// error handler
app.use(error);

// if the PORT is not given in .env file assume 3000
const port = process.env.PORT || 3000;

app.listen(port, () =>
// output to console everytime the server starts
// eslint-disable-next-line no-console
  console.log(`NodeJS Server listening on port ${port}. \nMode: ${process.env.NODE_ENV}`));
  
// end by exporting app
module.exports = app;
