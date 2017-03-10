/*
 使用generator并以5个为一组发送请求
 小缺点是不能始终保持并发数为5，中间会回落几次
 */


const Promise = require('bluebird');
const _ = require('lodash');
const co = require('co');
const moment = require('moment');
var rp = require('request-promise');
var fs = Promise.promisifyAll(require('fs'));

const newQuestionUrl = 'http://hr.amiaodaifu.com:50000/1610/new-question';
const getChildrenUrl = 'http://hr.amiaodaifu.com:50000/1610/questions/';

var tree = {};

const getNode = id => tree[id] ? {
    id,
    children: tree[id] || []
  } : {children: []};

const getTree = id => ({
  id,
  children: getNode(id).children.map(getTree)
});

// concurrency=1
// function* gen(root, data, qid) {
//     if (data.length != 0) {
//         for (let i = 0; i < data.length; i++) {
//             let val = data[i];
//             root.children.push(newNode(val));
//             var cchild = yield getJson(`${getChildrenUrl}${qid}/get-children/${val}`);
//             yield gen(root.children[i], cchild, qid);
//         }
//     }
//     log(root);
//     return root;
// }

//concurrency=5
function* gen(childrenArray, qid) {

  if (childrenArray.length != 0) {
    for (let i = 0; i < childrenArray.length; i += 5) {

      let max = i + 5 > childrenArray.length ? childrenArray.length : i + 5;

      let yieldEvent = [];
      let tmp = [];

      for (var j = i; j < max; j++) {
        let val = childrenArray[j];
        yieldEvent.push(getJson(`${getChildrenUrl}${qid}/get-children/${val}`));
        log(`get ${val} --->`);
        tmp.push(val);
      }
      let cchild = yield yieldEvent;
      log(cchild);

      //本地保存节点对应的子代顺序
      for (let z = 0; z < cchild.length; z++) {
        tree[tmp[z]] = cchild[z];
      }

      //把子代变为一维数据
      yield gen(_.flattenDeep(cchild), qid);
    }
  }
}


co(function *() {

  let question = yield postJson(newQuestionUrl, {
    mail: 'XXX'
  });
  log(question);

  var rootid = question.rootId;
  var qid = question.id;

  console.log(`rootid %j , qid %j`, rootid, qid);

  var root = newNode(rootid);
  var child = yield getJson(`${getChildrenUrl}${qid}/get-children/${rootid}`);
  console.log('child %j', child);

  //orign 并发=1
  // let ret = yield gen(root, child, qid);
  // console.log('ret %j', ret);

  //控制并发=5
  tree[rootid] = child;
  yield gen(child, qid);
  console.log('tree %j', tree);

  let ret = getTree(rootid);
  console.log('gen tree --> ret %j', ret);


  log('-----------');

  //验证结果 POST
  let checkURL = `http://hr.amiaodaifu.com:50000/1610/questions/${qid}/check`;
  let checkBody = {
    root: ret
  };
  let checkResult = yield postJson(checkURL, checkBody);
  log('\n---验证结果----');
  log(checkResult);
  log('---验证结果----\n');

  //提交源代码和个人联系信息
  let submitURL = `http://hr.amiaodaifu.com:50000/1610/questions/${qid}/submit`;
  let sourceCode = yield getFileContent();
  let submitBody = {
    name: 'XXX',
    forFun: 'false',
    phone: 'XXX',
    sourceCode
  };

  let submitResult = yield postJson(submitURL, submitBody);
  log('\n---提交结果----');
  log(submitResult);
  log('---提交结果----\n');

}).catch(err => console.error(err));


function newNode(id) {
  return {id, children: []}
}

function postJson(uri, body) {
  return rp({uri, body, method: "POST", json: true});
}


function getFileContent() {
  return fs.readFileAsync('./interview.js', 'utf8');
}

function getJson(uri) {
  return rp({uri, json: true})
}

function log(msg) {
  let now = moment.utc(Date.now()).local().format('YYYY-MM-DD HH:mm:ss');
  console.log("%s \ %j", now, msg);
}


