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
// also use a dummy user
// const dummytoken = jwtSign({id: '63cda377d498040594c753b9'});
// before each , opens the server
test.before(async (t) => {
  t.context.server = http.createServer(app);
  t.context.prefixUrl = await listen(t.context.server);
  t.context.got = got.extend({http2: true, throwHttpErrors: false, responseType: 'json', prefixUrl: t.context.prefixUrl});
});
// after we are finished we close the server
test.after.always((t) => {
  t.context.server.close();
});
// make sure to adjust the #sources to fit how many exist right now
test('GET /statistics in the users file', async (t) => {
  // does a GET request to the path
  const {body, statusCode} = await t.context.got('general/statistics');
  t.is(body.sources, 2);
  // this test should always pass
  t.assert(body.success);
  t.is(statusCode, 200);
});
