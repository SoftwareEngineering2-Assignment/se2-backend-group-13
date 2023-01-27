/* eslint-disable import/no-unresolved */
require('dotenv').config();
// reads .env to connect to db
// imports
const http = require('node:http');
const test = require('ava').default;
const got = require('got');
const listen = require('test-listen');
const app = require('../src/index');
const {jwtSign} = require('../src/utilities/authentication/helpers');
// initialize my token to use in the tests
const myid = '63bdd8ed050a9611142d34c4';
const token = jwtSign({id: myid});

module.exports = {
  http,
  test,
  got,
  listen,
  app,
  token
};
