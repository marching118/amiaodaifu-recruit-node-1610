/*
 * 利用async/queue
 */

'use strict';

const http = require('http');
const queue = require('async/queue');
const fs = require('fs');

const TARGET_HOSTNAME = 'hr.amiaodaifu.com';
const PORT = 50000;
const BASE_PATH = '/1610';
const NEW_QUESTION_PATH = '/new-question';
const QUESTIONS_PATH = '/questions/';
const QUESTIONS_URL_PREFIX = 'http://' + TARGET_HOSTNAME + ':' + PORT + BASE_PATH + QUESTIONS_PATH;
const GET_CHILDREN_PATH = '/get-children/';
const CHECK_PATH = '/check';
const SUBMIT_PATH = '/submit';
const EMAIL = 'XXX';
const NAME = 'XXX';
const PHONE = 'XXX';
const FOR_FUN = false;

let globalState = {};
function setStaticPropertyOfObject(object, propertyName, propertyValue) {
  Object.defineProperty(object, propertyName, {value: propertyValue});
}

function getJSONObjectFromRes(res, cb) {
  res.setEncoding('utf-8');
  res.on('data', (str) => {
    let result;
    try {
      result = JSON.parse(str);
    } catch (e) {
      console.log('result string: ' + str + ', parse error: ' + e);
      return cb(e);
    }
    cb(null, result);
  });
}

function sendHTTPPostRequest(data, path, cb) {
  let str = JSON.stringify(data);
  let req = http.request({
    method: 'POST',
    hostname: TARGET_HOSTNAME,
    port: PORT,
    path: BASE_PATH + path,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': str.length
    }
  }, (res) => {
    getJSONObjectFromRes(res, function (err, result) {
      cb(err, result);
    });
  });
  req.on('error', (e) => {
    console.log('send http post request error: ' + e);
    cb(e);
  });
  req.write(str);
  req.end();
}

function getNewQuestion(cb) {
  sendHTTPPostRequest(
    {mail: EMAIL},
    NEW_QUESTION_PATH,
    (err, result) => {
      if (err) {
        cb(err);
      } else {
        console.log('got new question success, questionId is ' + result.id + ', rootId is ' + result.rootId);
        setStaticPropertyOfObject(globalState, 'questionId', result.id);
        cb(null, result.rootId);
      }
    }
  );
}

function getNode(id, cb) {
  http.get(QUESTIONS_URL_PREFIX + globalState.questionId + GET_CHILDREN_PATH + id, (res) => {
    getJSONObjectFromRes(res, (err, result) => {
      if (err) {
        cb(err);
      } else {
        console.log('got node ' + id + ' success, its children is [' + result + ']');
        cb(null, result);
      }
    });
  }).on('error', (e) => {
    console.log('send get node request error: ' + e);
    cb(e);
  });
}

let taskQueue = queue(getTree, 5);

function getTree(rootNode, callback) {
  getNode(rootNode.id, (err, children) => {
    if (err) {
      console.log('get node ' + rootNode.id + ' error: ' + err);
    } else {
      if (children.length) {
        children.forEach((childrenId, index) => {
          rootNode.children[index] = {
            id: childrenId,
            children: []
          };
          taskQueue.push(rootNode.children[index]);
        });
      }
    }
    callback();
  });
}

let tree;
taskQueue.drain = function () {
  console.log('going to check tree: ' + JSON.stringify(tree));
  sendHTTPPostRequest(
    {root: tree},
    QUESTIONS_PATH + globalState.questionId + CHECK_PATH,
    (err, result) => {
      if (err) {
        console.log('check result error!');
      } else {
        console.log('check result is', result);
        if (result.pass) {
          sendHTTPPostRequest(
            {
              name: NAME,
              forFun: FOR_FUN,
              phone: PHONE,
              sourceCode: fs.readFileSync(__filename, {encoding: 'utf8'})
            },
            QUESTIONS_PATH + globalState.questionId + SUBMIT_PATH,
            (err, result) => {
              if (err) {
                console.log('submit err!');
              } else {
                console.log(result.msg);
              }
            }
          );
        }
      }
    }
  );
};

getNewQuestion(function (err, rootId) {
  if (err) {
    console.log('get new question error: ' + err);
  } else {
    tree = {
      id: rootId,
      children: []
    };
    taskQueue.push(tree);
  }
});
