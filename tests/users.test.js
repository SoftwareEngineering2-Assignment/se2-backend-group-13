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

// // give wrong user
// test('POST /changepassword change password for a non existing user', async (t) => {
//   // password doesnt matter
//   const changePass = {password: 'password5'};
//   // body has the password , query has token and username
//   // we need a token that has the correct structure but has wrong variables
//   const dummytoken = jwtSign({id: '63bdd8ed050a9611142d34c4', username: 'bot123'});
//   const {body, statusCode} = await t.context.got.post(`users/changepassword?token=${dummytoken}`, {json: changePass});
//   // sc 200
//   t.is(statusCode, 200);
//   // message user not found
//   t.is(body.status, 404);
//   t.is(body.message, 'Resource Error: User not found.');
// });
