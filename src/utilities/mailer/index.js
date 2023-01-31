// import the other 2 files in this folder
const password = require('./password');
const send = require('./send');
// and export them
module.exports = {
  mail: password,
  send
};
