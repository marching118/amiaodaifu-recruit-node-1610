/*
 利用event
 */

const http = require('http');
const fs = require('fs');
const events = require('events');

function post(path, json, cb) {
  let options = {
    host: 'hr.amiaodaifu.com',
    port: 50000,
    path: `/1610/${path}`,
    method: 'GET'
  };
  let content = undefined;
  if (json !== null) {
    content = new Buffer(JSON.stringify(json));
    options.method = 'POST';
    options.headers = {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Length": content.length
    };
  }

  let req = http.request(options, function (res) {
    let content = "";
    res.on("data", (data) => content += data);
    res.on("end", () => cb(
      res.statusCode === 200 ? JSON.parse(content) : null
    ));
  });
  req.on("error", (e) => cb(null));
  req.end(content);
}

function _new(cb) {
  post('new-question', {mail: 'XXX'}, cb);
}

function _get(questionId, id, cb) {
  post(`questions/${questionId}/get-children/${id}`, null, cb);
}

function _check(questionId, json, cb) {
  post(`questions/${questionId}/check`, {root: json}, cb);
}

function _submit(questionId, cb) {
  post(`questions/${questionId}/submit`, {
    name: "XXX",
    forFun: true,
    phone: 'XXX',
    sourceCode: fs.readFileSync(__filename, 'utf-8')
  }, cb);
}

class p1610 extends events {
  constructor() {
    super();
    _new((question) => {
      if (question === null) return;
      this.questionId = question.id;
      this.root = {id: question.rootId, children: []};
      this.queue = [this.root];
      this.tasks = 0;
      this.emit('get');
    });
  }

  run(father) {
    _get(this.questionId, father.id, (childrenId) => {
      if (childrenId === null)
        this.queue.push(father);
      else
        for (let i = 0; i < childrenId.length; i++) {
          let leaf = {id: childrenId[i], children: []};
          this.queue.push(leaf);
          father.children.push(leaf);
        }
      this.task--;
      this.emit('get');
    });
  }

  get() {
    while (this.queue.length && this.tasks < 5) {
      this.task++;
      this.run(this.queue.shift());
    }
    if (!this.queue.length && !this.tasks) this.emit('check');
  }

  check() {
    _check(this.questionId, this.root, (judge) => {
      if (judge === null) return;
      if (judge.pass) this.emit('submit');
      console.log(judge);
    });
  }

  submit() {
    _submit(this.questionId, (message) => console.log(message));
  }
}

let task = new p1610;
task.on('get', task.get);
task.on('check', task.check);
task.on('submit', task.submit);
