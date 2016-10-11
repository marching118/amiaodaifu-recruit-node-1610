'use strict';

const request = require('request-promise'),
  Promise = require('bluebird');

const mail = 'marching118@gmail.com';
const host = 'localhost';
let questionId;

function buildLimitRequest(n) {
  let pending = [];
  let running = 0;

  function run() {
    let runPromise = request(...arguments);
    runPromise.then(() => pending.length ? pending.shift()() : running--);
    return runPromise;
  }

  return function () {
    if (running >= n || pending.length) {
      return new Promise(resolve => pending.push(resolve)).then(run.bind(null, ...arguments));
    } else {
      running++;
      return run(...arguments);
    }
  };
}
const request5 = buildLimitRequest(5);

request5({
  method: 'POST',
  url: `http://${host}:50000/1610/new-question`,
  json: {mail}
})
  .then(r => {
    console.log(r);
    questionId = r.id;
    const getTree = nodeId => request5(`http://${host}:50000/1610/questions/${questionId}/get-children/${nodeId}`, {json: true})
      .then(children => Promise.all(children.map(getTree)))
      .then(children => ({id: nodeId, children}));
    return getTree(r.rootId);
  })
  .then(root => request5({
    method: 'POST',
    url: `http://${host}:50000/1610/questions/${questionId}/check`,
    json: {root}
  }))
  .then(r => {
    console.log(r);
    if (r.pass) {
      return request5({
        method: 'POST',
        url: `http://${host}:50000/1610/questions/${questionId}/submit`,
        json: {
          name: '马骎',
          forFun: false,
          phone: '15900000000',
          sourceCode: require('fs').readFileSync('./answer.js', 'utf-8')
        }
      })
    }
  })
  .then(r => console.log(r))
  .catch(e => {
    console.error(e);
  });
