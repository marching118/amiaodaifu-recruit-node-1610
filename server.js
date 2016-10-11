'use strict';

const Promise = require('bluebird'),
  _ = require('lodash'),
  question = require('./question');

const app = require('koa')();
app.use(require('koa-body')());
const router = new require('koa-router')({prefix: '/1610'});

router.get('/info', function *() {
  this.body = {
    msg: 'AMYS 1610 js test'
  };
});

router.post('/new-question', function *() {
  const {mail} = this.request.body;
  if (!mail) {
    this.status = 400;
    return this.body = {error: 'mail needed'};
  }

  const q = yield question.buildQuestion(this.request.ip, this.request.body.mail);
  this.body = {
    id: q.id,
    rootId: q.root.id
  };
});

router.get('/questions/:questionId/get-children/:nodeId', function *() {
  const q = question.getQuestion(this.params.questionId);
  if (!q) {
    this.status = 400;
    return this.body = {error: 'no such question or question timeout'};
  }

  const node = q.nodeMap[this.params.nodeId];
  if (!node) {
    this.status = 400;
    return this.body = {error: 'no such node'};
  }

  q.c++;
  if (q.c > q.cMax) {
    q.cMax = q.c;
  }
  yield Promise.delay(100);
  this.body = node.children.map(i => i.id);
  q.c--;
});

router.post('/questions/:questionId/check', function *() {
  const q = question.getQuestion(this.params.questionId);
  if (!q) {
    this.status = 400;
    return this.body = {error: 'no such question or question timeout'};
  }

  const {root} = this.request.body;
  if (!root) {
    this.status = 400;
    return this.body = {error: 'root needed'};
  }

  this.body = {
    pass: yield q.check(root),
    concurrency: q.cMax,
    time: q.endAt - q.startAt
  };
});

router.post('/questions/:questionId/submit', function *() {
  const q = question.getQuestion(this.params.questionId);
  if (!q) {
    this.status = 400;
    return this.body = {error: 'no such question or question timeout or question check fail'};
  }
  if (!q.pass) {
    this.status = 400;
    return this.body = {error: 'submit before pass'};
  }

  const {sourceCode, forFun, name, phone} = this.request.body;
  if (!sourceCode) {
    this.status = 400;
    return this.body = {error: 'no sourceCode'};
  }

  if (!forFun && !phone) {
    this.status = 400;
    return this.body = {error: 'need phone or forFun'};
  }

  yield q.submit({sourceCode, forFun, name, phone});
  this.body = {
    msg: 'thank you!'
  };
});

app.use(router.routes()).use(router.allowedMethods());
const server = require('http').createServer(app.callback());
server.listen(50000, () => console.log(`server start 50000`));
