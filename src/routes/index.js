// import needed modules
const express = require('express');
const users = require('./users');
const sources = require('./sources');
const dashboards = require('./dashboards');
const general = require('./general');
const root = require('./root');
// initialize router
const router = express.Router();
// use the imported modules
router.use('/users', users);
router.use('/sources', sources);
router.use('/dashboards', dashboards);
router.use('/general', general);
router.use('/', root);
// export router
module.exports = router;
