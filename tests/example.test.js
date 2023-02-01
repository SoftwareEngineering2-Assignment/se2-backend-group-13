/* eslint-disable import/no-unresolved */
// make sure we have ava
const test = require('ava').default;
// test that always passes
test('Test to pass', (t) => {
  t.pass();
});
// test that has a=1 and checks if a+1=2
test('Test value', async (t) => {
  const a = 1;
  t.is(a + 1, 2);
});
// declare function sum that adds two variables
const sum = (a, b) => a + b;
// test for sum function
test('Sum of 2 numbers', (t) => {
  t.plan(2);
  t.pass('this assertion passed');
  t.is(sum(1, 2), 3);
});
