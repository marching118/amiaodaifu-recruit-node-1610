/*
 * async基本使用，没有做扩展要求
 */

var request = require("request");
var async = require("async");
var _ = require("lodash");

async.waterfall([
  (cb) => {
    return cb(null, {});
  },
  (context, cb) => {
    request.post(`http://hr.amiaodaifu.com:50000/1610/new-question`, {
      json: {
        mail: 'test@test.com'
      }
    }, (err, res, body) => {
      if (err) {
        return cb(err);
      }
      return cb(null, _.merge(context, {
        root: body
      }));
    });
  },
  (context, cb) => {
    var findChildren = (id, done) => {
      request.get(`http://hr.amiaodaifu.com:50000/1610/questions/${context.root.id}/get-children/${id}`, {}, (err, res, body) => {
        if (err) {
          return done(err);
        }
        try {
          body = JSON.parse(body);
        } catch (ex) {
          return done(ex);
        }
        var actions = _(body)
          .filter(cid => {
            cid = parseInt(cid);
            return _.isNumber(cid) && !_.isNaN(cid);
          })
          .map(cid => {
            return (fn) => {
              console.log("current " + cid);
              findChildren(cid, (err, children) => {
                return fn(err, {
                  id      : cid,
                  children: children
                });
              });
            }
          })
          .valueOf();
        async.parallelLimit(actions, 3, (err, results) => {
          return done(err, results);
        });
      });
    };

    findChildren(context.root.rootId, (err, children) => {
      if (err) {
        return cb(err);
      }
      return cb(null, _.merge(context, {
        result: {
          root: {
            id      : context.root.rootId,
            children: children
          }
        }
      }))
    });
  },
  (context, cb) => {
    request.post(`http://hr.amiaodaifu.com:50000/1610/questions/${context.root.id}/check`, {
      json: context.result
    }, (err, res, body) => {
      if (err) {
        return cb(err);
      }
      console.log(JSON.stringify(context.result, null, 2));
      console.log(JSON.stringify(context.check));
      return cb(null, _.merge(context, {
        check: body
      }));
    });
  },
  (context, cb) => {
    if (context.check.pass) {
      let fs = require("fs");
      let path = require("path");
      request.post(`http://hr.amiaodaifu.com:50000/1610/questions/${context.root.id}/submit`, {
        json: {
          name: "孙敬云",
          phone: "15652187053",
          forFun: true,
          sourceCode: fs.readFileSync(path.resolve(__dirname, 'tree-question.js'), "utf-8")
        }
      }, (err, res, body) => {
        if (err) {
          return cb(err);
        }
        console.log(body);
        return cb(null, context);
      });
    } else {
      return cb(null, context);
    }
  }
], (err, context) => {
  if (err) {
    console.log(err);
  } else {
    console.log("finish");
  }
});


