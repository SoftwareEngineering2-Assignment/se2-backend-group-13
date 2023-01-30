const {http, test, got, listen, app, token} = require('./testimports');
// before each , opens the server
test.before(async (t) => {
  t.context.server = http.createServer(app);
  t.context.prefixUrl = await listen(t.context.server);
  t.context.got = got.extend({http2: true, throwHttpErrors: false, responseType: 'json', prefixUrl: t.context.prefixUrl});
});
// after we are finished we close the server
test.after.always(async (t) => {
  t.context.server.close();
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
// check-sources function
test(' POST /check-sources ', async (t) => {
  // body of the request we give names inside a json
  const source123 = {sources: ['zero', 'dracula', 'animal']};
  // do the post with my token
  const {statusCode, body} = await t.context.got.post(`sources/check-sources?token=${token}`, {json: source123});
  // test should pass
  t.is(statusCode, 200);
  // the user doesnt own the 2 first so we now has his copies
  t.is(body.newSources[0], source123.sources[0]);
  t.is(body.newSources[1], source123.sources[1]);
  // we are expecting 2
  t.is(body.newSources.length, 2);
});

// quickly delete the 2 new sources from the previous test
test('DELETE /delete-source delete the last 2 sources ', async (t) => {
  // we need 2 ids
  const {body: b1} = await t.context.got(`sources/sources?token=${token}`);
  const delid1 = b1.sources[1].id;
  const delid2 = b1.sources[2].id;
  // create a json for each of the sources we want to delete
  const delSource1 = {id: delid1};
  const delSource2 = {id: delid2};
  // do the query with the correct body each time
  const {statusCode: sc1, body: b2} = await t.context.got.post(`sources/delete-source?token=${token}`, {json: delSource1});
  const {statusCode: sc2, body: b3} = await t.context.got.post(`sources/delete-source?token=${token}`, {json: delSource2});
  // sC is 200
  t.is(sc1, 200);
  t.is(sc2, 200);
  // the body that is returned is just a success
  t.assert(b2.success);
  t.assert(b3.success);
});
