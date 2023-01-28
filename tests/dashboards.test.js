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

// create duplicate user with existing email
test('POST /create create duplicate user', async (t) => {
  // give an existing email
  const newduplicateuser = {username: 'testuser5', password: 'testpassword6', email: 'evilkotsos@gmail.com'};
  const {body, statusCode} = await t.context.got.post('users/create', {json: newduplicateuser});
  // this test should pass
  // and body status is 409
  t.is(body.status, 409);
  t.is(statusCode, 200);
});
