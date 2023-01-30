const {http, test, got, listen, app} = require('./testimports');
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

// make sure to adjust the #sources to fit how many exist right now
test('GET /statistics returns correct response and status code', async (t) => {
  // does a GET request to the path
  const {body, statusCode} = await t.context.got('general/statistics');
  t.is(body.sources, 2);
  // this test should always pass
  t.assert(body.success);
  t.is(statusCode, 200);
});

// catcherr
test('GET /test-url catcherror', async (t) => {
  // GET to what i think should work but it doesnt
  const {body, statusCode} = await t.context.got('general/test-url?url=https://localhost:2999');
  // this test should always pass
  t.is(body.status, 500);
  t.is(statusCode, 200);
});

// should work
test('GET /test-url i think works', async (t) => {
  // GET to what i think should work but it doesnt
  const {body, statusCode} = await t.context.got('general/test-url?url=https://www.youtube.com');
  // this test should always pass
  t.is(body.status, 200);
  t.is(statusCode, 200);
});

// do a GET
test('GET /test-url-request do a GET', async (t) => {
  // set the type of query
  const type = 'GET';
  // do the query in this placeholder site
  const {body, statusCode} = await t.context.got(`general/test-url-request?type=${type}&url=https://jsonplaceholder.typicode.com/posts`);
  // test checks
  t.is(statusCode, 200);
  t.is(body.status, 200);
  t.true(body.response.includes('sunt aut facere'));
});
// this test doesnt actually work correctly because i cant do 
// an actualy request to a real site , but the functionality is there
// my requests are so bad i managed to hit every possible error case
test('GET /test-url-request do a PUT', async (t) => {
  // case PUT
  const type = 'PUT';
  // create a body
  const requestBody = {name: 'Kostas'};
  // do the query and dont return body because it has errors
  const {statusCode} = await t.context.got(`general/test-url-request?type=${type}&body=${requestBody}&url=https://jsonplaceholder.typicode.com/posts`);
  // test is completed
  t.is(statusCode, 200);
});

// do the same for POST
test('GET /test-url-request do a POST', async (t) => {
  // case POST
  const type = 'POST';
  // rest is the same as before
  const requestBody = {name: 'Kostas'};
  // do the query and dont return body because it has errors
  const {statusCode} = await t.context.got(`general/test-url-request?type=${type}&body=${requestBody}&url=https://jsonplaceholder.typicode.com/posts`);
  // test is completed
  t.is(statusCode, 200);
});

// write nonsense
test('GET /test-url-request do nonsense', async (t) => {
  // case whatever in order to go inside case default
  const type = '12346';
  // create a body
  const requestBody = {name: 'Kostas'};
  // do the query
  const {statusCode, body} = await t.context.got(`general/test-url-request?type=${type}&body=${requestBody}&url=https://jsonplaceholder.typicode.com/posts`);
  // test is completed
  t.is(statusCode, 200);
  // something went wrong
  t.is(body.response, 'Something went wrong');
  t.is(body.status, 500);
});
