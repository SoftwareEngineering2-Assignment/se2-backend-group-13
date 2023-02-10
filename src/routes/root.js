// import needed modules
const express = require('express');
const path = require('path');
// initialize router
const router = express.Router();
// read file
const file = path.join(__dirname, '../../index.html');
// use file with router
router.use(express.static(file));
// request handler
router.get('/', (req, res) => res.sendFile(file));
// export router
module.exports = router;
