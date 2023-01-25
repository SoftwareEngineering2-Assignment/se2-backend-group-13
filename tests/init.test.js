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
const { string } = require('yup');
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
  t.is(body.sources, 1);
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
  const {statusCode} = await t.context.got.post(`sources/create-source?token=${token}`, {json: newSource});
  t.is(statusCode, 200);
});

test('POST /create-source creates the same source as before', async (t) => {
  // give my id
  const token = jwtSign({id: '63bdd8ed050a9611142d34c4'});
  // create a json to give as input to the POST request
  const newSource = {
    name: 'leader', type: 'mqtt', url: 'https://snap.fan/cards/Leader/', login: 'kotsos', passcode: 'kotsos2'
  };
  // return the body , give my token in path and the json as the second input
  const {statusCode, body} = await t.context.got.post(`sources/create-source?token=${token}`, {json: newSource});
  t.is(statusCode, 200);
  // since its a duplicate we expect the response of the post to be 409
  t.is(body.status, 409);
});

// test('POST /change-source we change the name of the previous json', async (t) => {
//   const token = jwtSign({id: '63bdd8ed050a9611142d34c4'});
//   // get all the sources in order to read the ID and name
//   const {body} = await t.context.got(`sources/sources?token=${token}`);
//   const newId = body.sources[1].id;
//   const oldname = body.sources[1].name;
//   const changedSource = {
//     _id: newId, name: oldname, type: 'mqtt', url: 'https://marvelsnapzone.com/decks/zabucula-2/', login: 'kotsos', passcode: 'kotsos2'
//   };
//   console.log(changedSource);
//   const {statusCode} = await t.context.got.post(`sources/change-source?token=${token}`, {json: changedSource});
//   t.is(statusCode, 200);
// });
