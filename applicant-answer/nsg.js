/*
 构造限制并发数的request
 */


import rp from 'request-promise'
const fs = require('fs');

const MAX_REQUEST = 5
const requestsArr = [], retObj = {}
let requestCount = 0, subTreeCount, subId, rootId

function startRequest(cbFunc) {
  if (cbFunc) {
    requestsArr.push(cbFunc)
  }
  else {
    requestCount--
  }
  if (requestsArr.length > 0 && requestCount < MAX_REQUEST) {
    requestCount++
    requestsArr.shift()();
  }
}


function httpRequest(options) {
  return new Promise((resolve, reject) => {
    startRequest(() => {
      rp(options).then(val => {
        resolve(val)
        startRequest()
      }).catch(err => {
        console.log(err)
        reject(err)
        startRequest()
      })
    })

  })
}

function postSource() {
  const sourceCode = fs.readFileSync('./main.js', 'utf8')
  httpRequest({
    uri: `http://hr.amiaodaifu.com:50000/1610/questions/${subId}/submit`,
    method: 'POST',
    body: {
      name: 'XXX',
      forFun: false,
      phone: 'XXX',
      sourceCode: sourceCode.toString()
    },
    json: true
  }).then(val => {
    console.log(val)
  })

}

function checkVal() {
  console.log('checkVal', JSON.stringify(retObj))
  httpRequest({
    uri: `http://hr.amiaodaifu.com:50000/1610/questions/${subId}/check`,
    method: 'POST',
    body: retObj,
    json: true
  }).then(val => {
    console.log('checkVal', val)
    if (val.pass) {
      postSource()
    }
  })

}

function getNode(id, pObj) {
  httpRequest({
    uri: `http://hr.amiaodaifu.com:50000/1610/questions/${subId}/get-children/${id}`,
    json: true
  }).then(val => {
    subTreeCount--
    subTreeCount += val.length
    for (let nId of val) {
      const newNode = {id: nId, children: []}
      pObj.children.push(newNode)
      getNode(nId, newNode)
    }
    if (subTreeCount <= 0) {
      checkVal()
    }
  })
}

function getNewSub() {
  httpRequest({
    uri: 'http://hr.amiaodaifu.com:50000/1610/new-question',
    method: 'POST',
    body: {mail: 'nishaoguang@gmail.com'},
    json: true
  }).then(val => {
    console.log('getNewSub', val)
    subTreeCount = 1
    subId = val.id
    rootId = val.rootId
    retObj.root = {id: rootId, children: []}
    getNode(rootId, retObj.root)
  })
}

getNewSub()