/* eslint-disable import/no-unresolved */
require('dotenv').config();
// reads .env to connect to db
// imports
const http = require('node:http');
const test = require('ava').default;
const got = require('got');
const listen = require('test-listen');
const { string } = require('yup');
const app = require('../src/index');
const {jwtSign} = require('../src/utilities/authentication/helpers');
// initialize my token to use in the tests
const token = jwtSign({id: '63bdd8ed050a9611142d34c4'});
// also use a dummy user
const dummytoken = jwtSign({id: '63cda377d498040594c753b9'});
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
// passing test
test('GET /sources returns correct response and status code', async (t) => {
  // does a get request to the path (using my id) and gets all the sources from me
  const {statusCode, body} = await t.context.got(`sources/sources?token=${token}`);
  // should always pass
  t.is(statusCode, 200);
  // my first source is named animal
  t.is(body.sources[0].name, 'animal');
});
// passing test
test('POST /create-source creates a new source', async (t) => {
  // create a json to give as input to the POST request
  const newSource = {
    name: 'leader', type: 'mqtt', url: 'https://snap.fan/cards/Leader/', login: 'kotsos', passcode: 'kotsos2', vhost: ''
  };
  // give my token in path and the json as the second input
  const {statusCode} = await t.context.got.post(`sources/create-source?token=${token}`, {json: newSource});
  t.is(statusCode, 200);
});
// semi-failing test
test('POST /create-source creates the same source as before now it shouldnt work', async (t) => {
  // create a json to give as input to the POST request
  const newSource = {
    name: 'leader', type: 'mqtt', url: 'https://snap.fan/cards/Leader/', login: 'kotsos', passcode: 'kotsos2', vhost: ''
  };
  // give my token in path and the json as the second input
  const {statusCode, body} = await t.context.got.post(`sources/create-source?token=${token}`, {json: newSource});
  t.is(statusCode, 200);
  // since its a duplicate we expect the response of the post to be 409
  t.is(body.status, 409);
});
// passing test
test('POST /change-source we change the url of the previous json', async (t) => {
  // get all the sources in order to read the ID and name
  const {body: b1} = await t.context.got(`sources/sources?token=${token}`);
  // we use the old name and id because its needed in the function
  const existingId = b1.sources[1].id;
  const existingname = b1.sources[1].name;
  // create the new json
  const changedSource = {
    id: existingId, name: existingname, type: 'mqtt', url: 'https://marvelsnapzone.com/decks/zabucula-2/', login: 'kotsos', passcode: 'kotsos2', vhost: ''
  };
  // statusCode should be 200 , 
  const {statusCode} = await t.context.got.post(`sources/change-source?token=${token}`, {json: changedSource});
  t.is(statusCode, 200);
  // lets see if it changed
  // do another get query
  const {body: b2} = await t.context.got(`sources/sources?token=${token}`);
  // check the changed feature which is the url
  t.is(b2.sources[1].url, 'https://marvelsnapzone.com/decks/zabucula-2/');
});
// failing test
test('POST /change-source we change the previous json but now we fail', async (t) => {
  // create a new random json to search in the db
  const changedSource = {
    id: 12, name: 'wevwe', type: 'mqtt', url: 'hhtp', login: 'kotsos', passcode: 'kotsos2', vhost: ''
  };
  // we will read both later , input same as before
  const {statusCode, body} = await t.context.got.post(`sources/change-source?token=${token}`, {json: changedSource});
  // status code is 200
  t.is(statusCode, 200);
  // it returns 409 the selected source has not been found
  t.is(body.status, 409);
});
// semi-failing test
test('POST /change-source we change the previous source but give it the name of the first', async (t) => {
  // get all the sources in order to read the ID and name we need
  const {body: b1} = await t.context.got(`sources/sources?token=${token}`);
  // we use source's 1 id and 0's name
  const existingId = b1.sources[1].id;
  const conflictingname = b1.sources[0].name;
  // create the new json
  const changedSource = {
    id: existingId, name: conflictingname, type: 'mqtt', url: 'https://marvelsnapzone.com/decks/zabucula-2/', login: 'kotsos', passcode: 'kotsos2', vhost: ''
  };
  // statusCode should be 200 , 
  const {statusCode, body: b2} = await t.context.got.post(`sources/change-source?token=${token}`, {json: changedSource});
  t.is(statusCode, 200);
  // now it returns 409 a source with the same name has been found
  t.is(b2.status, 409);
});
// passing test
test('DELETE /delete-source delete an existing source', async (t) => {
  // this time we need just the objectid
  const {body: b1} = await t.context.got(`sources/sources?token=${token}`);
  const delid = b1.sources[1].id;
  // create a json to put in the body
  const delSource = {id: delid};
  // do the query with the body
  const {statusCode, body: b2} = await t.context.got.post(`sources/delete-source?token=${token}`, {json: delSource});
  // sC is 200
  t.is(statusCode, 200);
  // the body that is return is just a success
  t.is(b2.success, true);
});
// failing test
test('DELETE /delete-source delete an non existing source', async (t) => {
  // create a json for the body
  const delSource = {id: 120941};
  // do the query
  const {statusCode, body} = await t.context.got.post(`sources/delete-source?token=${token}`, {json: delSource});
  // checks
  t.is(statusCode, 200);
  t.is(body.status, 409);
});
// lets us see another users source
test('POST /source sees another users source', async (t) => {
  // body should have name,owner,user
  // name is the name of the source we want to see
  // owner is its owner
  // user is the one who wants to see it
  const newSource = {name: 'zero', owner: '63cda377d498040594c753b9', user: '63bdd8ed050a9611142d34c4'};
  // give the json in the body
  const {statusCode, body} = await t.context.got.post('sources/source', {json: newSource});
  // should work
  t.is(statusCode, 200);
  // with console.log we can see the returned json
  // we know what it is so we check its url
  t.is(body.source.url, 'https://snap.fan/cards/Zero/');
});
// failing test
test('POST /source doesnt see another users source', async (t) => {
  // give random name to fail the test
  const newSource = {name: 'vwevwe', owner: '63cda377d498040594c753b9', user: '63bdd8ed050a9611142d34c4'};
  // do the query
  const {statusCode, body} = await t.context.got.post('sources/source', {json: newSource});
  // sC 200
  t.is(statusCode, 200);
  t.is(body.status, 409);
});
// just check sources left :)