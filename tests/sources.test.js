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
// these tests are not included in a seperate file users.test.js because the commit will cause ci to fail
/*

// ###### NOTE FOR THESE TESTS:
// ###### since theres no delete user function,
// ###### after the tests end we need to remove the new user
// ###### with username testuser6 from the database
// ###### because the first test is the create user test
// ###### and if the user is already in the database 
// ###### it will fail.use the mongodburi to connect to 
// ###### compass of the vscode extention,head to group_13
// ###### /users and he should be at the bottom

// create new user
test('POST /create create user', async (t) => {
  // put the info in the body, we need username password email
  const newuser = {username: 'testuser6', password: 'testpassword6', email: 'otinanai@gmail.com'};
  const {body, statusCode} = await t.context.got.post('users/create', {json: newuser});
  // this test should pass
  t.assert(body.success);
  t.is(statusCode, 200);
});

// create duplicate user with existing email
test('POST /create create duplicate user', async (t) => {
  // give an existing email
  const newduplicateuser = {username: 'testuser5', password: 'testpassword5', email: 'otinanai@gmail.com'};
  const {body, statusCode} = await t.context.got.post('users/create', {json: newduplicateuser});
  // this test should pass
  // and body status is 409
  t.is(body.status, 409);
  t.is(statusCode, 200);
});

// authenticate logging in
test('POST /authenticate user', async (t) => {
  // provide credentials
  const loginuser = {username: 'kotsos2000', password: 'password2000'};
  const {body, statusCode} = await t.context.got.post('users/authenticate', {json: loginuser});
  // this test should pass
  // check the username
  t.is(body.user.username, 'kotsos2000');
  t.is(statusCode, 200);
});

// authenticate with wrong username
test('POST /authenticate user with wrong name', async (t) => {
  // give wrong username
  const wrongname = {username: 'kotsos7', password: 'password'};
  const {body, statusCode} = await t.context.got.post('users/authenticate', {json: wrongname});
  // this test should pass
  // with body status 401
  t.is(body.status, 401);
  t.is(statusCode, 200);
});

// authenticate with wrong password
test('POST /authenticate user with wrong password', async (t) => {
  // give wrong password
  const wrongpass = {username: 'kotsos2000', password: 'password'};
  const {body, statusCode} = await t.context.got.post('users/authenticate', {json: wrongpass});
  // this test should  pass
  // with body status 401
  t.is(body.status, 401);
  t.is(statusCode, 200);
});

// reset password (forgot password)
test('POST /resetpassword reset password', async (t) => {
  // give just the username
  const resetpass = {username: 'kotsos2000'};
  const {body, statusCode} = await t.context.got.post('users/resetpassword', {json: resetpass});
  // this test should pass
  // body has this value
  t.is(body.ok, true);
  t.is(statusCode, 200);
});

// reset password for no user (forgot password)
test('POST /resetpassword reset password for no user', async (t) => {
  // give wrong username
  const resetpass = {username: 'kotsos7'};
  const {body, statusCode} = await t.context.got.post('users/resetpassword', {json: resetpass});
  // this test should not pass
  t.is(body.status, 404);
  t.is(statusCode, 200);
});  

// change password for the first time
test('POST /changepassword change password', async (t) => {
  // we can give the existing password as the new one
  const changePass = {password: 'password2000'};
  // body has the password , query has token and username
  const {body, statusCode} = await t.context.got.post(`users/changepassword?token=${token}`, {json: changePass});
  // sc 200
  t.is(statusCode, 200);
  // message password has changed
  t.is(body.message, 'Password was changed.');
});

// if we do it back to back it should not work because of timeout
test('POST /changepassword change password back to back', async (t) => {
  // password doesnt matter
  const changePass = {password: 'password5'};
  // body has the password , query has token and username
  const {body, statusCode} = await t.context.got.post(`users/changepassword?token=${token}`, {json: changePass});
  // sc 200
  t.is(statusCode, 200);
  // message password has changed
  t.is(body.status, 410);
  t.is(body.message, ' Resource Error: Reset token has expired.');
});

// import the jwtSign function in this file to use in the next test
const {jwtSign} = require('../src/utilities/authentication/helpers');

// give wrong user
test('POST /changepassword change password for a non existing user', async (t) => {
  // password doesnt matter
  const changePass = {password: 'password5'};
  // body has the password , query has token and username
  // we need a token that has the correct structure but has wrong variables
  const dummytoken = jwtSign({id: '63bdd8ed050a9611142d34c4', username: 'bot123'});
  const {body, statusCode} = await t.context.got.post(`users/changepassword?token=${dummytoken}`, {json: changePass});
  // sc 200
  t.is(statusCode, 200);
  // message user not found
  t.is(body.status, 404);
  t.is(body.message, 'Resource Error: User not found.');
});

 */
