/*
 每完成一个请求安排下一个请求
 */

var request = require('request');
var fs = require('fs');
var path = require('path');

function schedule(para) {
  while (para.concurrency < 5 && para.queue.length > 0) {
    para.concurrency++;
    getChildren(para);
  }
  if (para.concurrency <= 0 && para.queue.length == 0) {
    check(para);
  }
}

function getChildren(para) {
  var node_id = para.queue.pop();
  var url = 'http://hr.amiaodaifu.com:50000/1610/questions/' + para.question + '/get-children/' + node_id;
  request(url, function (error, response, body) {
    para.concurrency--;
    if (error) {
      para.queue.push(node_id);
    } else if (response.statusCode == 200) {
      var node = para.mapping[node_id];
      var children = JSON.parse(body);
      node.children = children.map(function (id) {
        return {"id": id, "children": []}
      });
      node.children.forEach(function (x) {
        para.mapping[x.id] = x;
        para.queue.push(x.id);
      });
    }
    schedule(para);
  });
}

function check(para) {
  var checkQuestionOptions = {
    uri: 'http://hr.amiaodaifu.com:50000/1610/questions/' + para.question + '/check',
    method: 'POST',
    json: {
      "root": para.mapping[para.root]
    }
  };

  request(checkQuestionOptions, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      if (body.pass && body.concurrency <= 5) {
        console.log(body);
        submit(para);
      }
    }
  });
}

function submit(para) {
  fs.readFile(__dirname + '/index.js', 'utf8', function (err, data) {
    if (err) throw err;

    var submitQuestionOptions = {
      uri: 'http://hr.amiaodaifu.com:50000/1610/questions/' + para.question + '/submit',
      method: 'POST',
      json: {
        'name': "XXX",
        'forFun': false,
        'phone': 'XXX',
        'sourceCode': data
      }
    };

    request(submitQuestionOptions, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log(body);
      }
    });
  });
}

(function (email) {
  var newQuestionOptions = {
    uri: 'http://hr.amiaodaifu.com:50000/1610/new-question',
    method: 'POST',
    json: {
      "mail": email
    }
  };

  request(newQuestionOptions, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var para = {
        question: body.id,
        concurrency: 0,
        queue: [body.rootId],
        mapping: {},
        root: body.rootId
      }
      para.mapping[body.rootId] = {"id": body.rootId};
      console.log("Searching...");
      schedule(para);
    }
  });
})('XXX');