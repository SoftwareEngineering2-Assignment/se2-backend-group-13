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
test('GET /statistics returns correct response and status code', async (t) => {
  // does a GET request to the path
  const {body, statusCode} = await t.context.got('general/statistics');
  t.is(body.sources, 2);
  // this test should always pass
  t.assert(body.success);
  t.is(statusCode, 200);
});

// my id 63bdd8ed050a9611142d34c4

test('GET /sources returns correct response and status code', async (t) => {
  // use the jwt function to give my id as input
  const token = jwtSign({id: '63bdd8ed050a9611142d34c4'});
  // does a get request to the path (using my id) and gets all the sources from me
  const {statusCode, body} = await t.context.got(`sources/sources?token=${token}`);
  // should always pass
  t.is(statusCode, 200);
  // my first source is named animal
  t.is(body.sources[0].name, 'animal');
});

test('POST /create-source creates a new source', async (t) => {
  // give my id
  const token = jwtSign({id: '63bdd8ed050a9611142d34c4'});
  // create a json to give as input to the POST request
  const newSource = {
    name: 'leader', type: 'mqtt', url: 'https://snap.fan/cards/Leader/', login: 'kotsos', passcode: 'kotsos2'
  };
  // return the body , give my token in path and the json as the second input
  const {body} = await t.context.got.post(`sources/create-source?token=${token}`, {json: newSource});
  t.is(body.status, 409);
});
