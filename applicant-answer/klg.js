/*
 利用async.eachLimit
 小缺点是不能始终保持并发数为5，中间会回落几次
 */

'use strict';

const request = require("request");
const async = require('async');
const fs = require('mz/fs');

var puzzleId = -1;

class TreeNode {
  constructor(nodeId) {
    this.nodeId = nodeId;
    this.children = [];
  }

  findChildren() {
    var self = this;
    // find all children of its own
    return new Promise((resolve, reject) => {
      var url = `http://hr.amiaodaifu.com:50000/1610/questions/${puzzleId}/get-children/${self.nodeId}`;
      request.get({
        url: url,
        json: true
      }, (err, httpResponse, data) => {
        console.log(`${url} => ${data}`);
        err ? reject(err) : resolve(data.map((nid) => {
            return new TreeNode(nid);
          }));
      })
    })
  }

  appendChild(child) {
    this.children.push(child);
  }

  buildOutput() {
    var self = this;
    return {
      id: self.nodeId,
      children: self.children.map((c) => {
        return c.buildOutput()
      })
    }
  }
}

function getPuzzle(cb) {
  return request.post({
    url: "http://hr.amiaodaifu.com:50000/1610/new-question",
    method: "POST",
    json: {
      "mail": "XXXX"
    }
  }, (err, httpResponse, data) => {
    console.log(data);
    puzzleId = data.id;
    cb(null, new TreeNode(data.rootId));
  })
}

function solvePuzzle(rootNode, cb) {
  var nodes = [rootNode];
  async.whilst(
    function () {
      return nodes.length > 0;
    },
    function (icb) {
      var tmpNodes = [];
      async.eachLimit(nodes, 5, (tmpNode, iicb) => {
        tmpNode.findChildren().then((children) => {
          children.forEach((c) => {
            tmpNode.appendChild(c);
            tmpNodes.push(c);
          });
          iicb(null)
        })
      }, (err, results) => {
        nodes = tmpNodes;
        icb(err, rootNode)
      });
    },
    function (err, rootNode) {
      cb(null, rootNode)
    }
  );

}

function checkPuzzle(rootNode, cb) {

  return request.post({
    url: `http://hr.amiaodaifu.com:50000/1610/questions/${puzzleId}/check`,
    method: "POST",
    json: {
      "root": rootNode.buildOutput()
    }
  }, (err, httpResponse, data) => {
    console.log(data);
    cb(null);
  })
}

function submitPuzzle(cb) {
  fs.read("source_code").then((sc) => {
    return request.post({
      url: `http://hr.amiaodaifu.com:50000/1610/questions/${puzzleId}/submit`,
      method: "POST",
      json: {
        "name": "XXXX",
        "forFun": true,
        "phone": "XXXX",
        "sourceCode": sc
      }
    }, (err, httpResponse, data) => {
      console.log(data);
      cb(null);
    })
  })
}

async.waterfall([
  getPuzzle,
  solvePuzzle,
  checkPuzzle
], function (err) {
  console.log("ok");
});
