'use strict';

const uuid = require('uuid'),
  _ = require('lodash'),
  db = require('./db');

const questions = {};

function buildQuestion(ip, mail) {
  console.log(`[NEW] ${mail} (${ip})`);

  let nodeGroups = _.range(20)
    .map(i => _.random(1, 4))
    .reduce((r, n) => {
      let nextId = _.last(_.last(r)) + 1;
      return [...r, _.range(nextId, nextId + n)]
    }, [[1]]);

  const root = {
    id: nodeGroups.shift()[0],
    // depth: 1,
    children: []
  };
  const nodeMap = {[root.id]: root};

  let toAdd = [root];
  while (nodeGroups.length) {
    let newToAdd = [];
    for (let node of toAdd) {
      if (nodeGroups.length) {
        node.children = nodeGroups.shift().map(id => ({
          id,
          // depth: node.depth + 1,
          children: []
        }));
        newToAdd = newToAdd.concat(node.children);
        node.children.forEach(n => nodeMap[n.id] = n)
      }
    }
    toAdd = newToAdd;
  }

  // console.log(JSON.stringify(root, null, 2));
  // Object.keys(nodeMap).forEach(id => console.log(id, nodeMap[id].children.map(i => i.id)));

  const question = {
    id: uuid.v4(),
    ip,
    mail,
    root,
    nodeMap,
    c: 0,
    cMax: 0,
    startAt: Date.now(),
    check: root => {
      question.pass = _.isEqual(question.root, root);
      question.endAt = Date.now();
      let dbUpdate;
      if (!question.pass) {
        delete question[question.id];
        dbUpdate = db.attempt.update({pass: false, answer: root}, {where: {tree: question.id}});
        console.log(`[FAIL] ${mail} (${ip})`);
      } else {
        dbUpdate = db.attempt.update({
          pass: true,
          concurrency: question.cMax,
          time: question.endAt - question.startAt
        }, {where: {tree: question.id}});
        console.log(`[SUCCESS] ${mail} (${ip})`);
      }
      return dbUpdate.then(() => question.pass);
    },
    submit: (data) => {
      console.log(`[SUBMIT] ${mail} (${ip})`);
      delete question[question.id];
      return db.attempt.update(data, {where: {tree: question.id}});
    }
  };
  questions[question.id] = question;

  setTimeout(() => delete question[question.id], 5 * 60 * 1000);

  return db.attempt.create({
    ip: question.ip,
    mail: question.mail,
    tree: question.id,
    root: question.root
  })
    .then(() => question);
}

function getQuestion(questionId) {
  return questions[questionId];
}

module.exports = {
  buildQuestion,
  getQuestion
};
