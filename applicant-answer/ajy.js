/*
 自己实现map来控制并发数量
 */

'use strict';
// var Promise = require('bluebird');
const request = require('request');
const newQuestionUrl = 'http://hr.amiaodaifu.com:50000/1610/new-question';
var getChildrenUrl = 'http://hr.amiaodaifu.com:50000/1610/questions/questionId/get-children/';
var checkUrl = 'http://hr.amiaodaifu.com:50000/1610/questions/questionId/check';
var submitUrl = 'http://hr.amiaodaifu.com:50000/1610/questions/questionId/submit';
const sourceCode = '';
const psMessage = '很不错的题目，原来是用node做游戏服务器后端的，web前后端涉猎广泛，刚刚离职，希望能最快时间接到面试通知，并且很希望加入你们！';

const doPost = (url, json) => new Promise((resolve, reject) => {
  request({method: 'post', url: url, json: true, body: json}, (error, response, body) => {
    if (error) {
      reject(error);
    } else {
      resolve(body);
    }
  });
});

let running = 0;
let concurrency = 5;

function map(arr, fn) {
  return new Promise(function (resolve, reject) {
    let completed = 0;
    let started = 0;
    let results = new Array(arr.length);
    (function finish() {
      if (completed >= arr.length) {
        return resolve(results);
      }
      while (running < concurrency && started < arr.length) {
        started++;
        let index = started - 1;
        fn.call(arr[index], arr[index], index)
          .then(function (result) {
            completed++;
            results[index] = result;
            finish();
          })
          .catch(reject);
      }
    })();
  });
}

const doGetNode = (id) => new Promise((resolve, reject) => {
  running++;
  console.log('getnode', id, 'running', running);
  request({url: getChildrenUrl + id, json: true}, (error, response, body) => {
    running--;
    if (error) {
      reject(error);
    } else {
      resolve({id: id, children: body});
    }
  });
});

const getResult = id => (doGetNode(id).then(node => map(node.children, getResult).then(children => ({
  id: id,
  children: children
}))));

const getANewSubject = doPost(newQuestionUrl, {mail: 'XXX'});
getANewSubject
  .then(question => {
    getChildrenUrl = getChildrenUrl.replace('questionId', question.id);
    checkUrl = checkUrl.replace('questionId', question.id);
    submitUrl = submitUrl.replace('questionId', question.id);
    return question;
  })
  .then(question => getResult(question.rootId))
  .then(result => {
    let sendResult = {root: result};
    return doPost(checkUrl, sendResult);
  })
  .then(res => {
    if (res.pass == true) {
      let personal = {name: 'XXX', forFun: false, phone: 'XXX', sourceCode: sourceCode}
      return doPost(submitUrl, personal)
    }
  })
  .then(res => {
    console.log(res);
  })
  .catch(err => {
    console.log(err);
  });