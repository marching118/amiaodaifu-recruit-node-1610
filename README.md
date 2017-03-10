node线上题目（2016年10月）
=======================

这道题目的考点是Javascript异步编程，题目包括
1. 基本（树的遍历）
2. 扩展（并发限制）

具体题目描述参见[原始帖子记录](/cnode-topic.md)

项目结构如下
```
├── applicant-answer   // 应聘者答案
├── server             // 试题服务器
├── answer.js          // 参考答案
├── cnode-topic        // 原始招聘信息帖子
└── package.json
```

参考答案说明
-----------
1. 基本（使用Promise实现，利用request-promise发送请求）
2. 扩展（通过buildLimitFunction来构造了一个限制并发数的函数）

扩展问题使用这种方法，保持第一部分的代码不变，代码结构比较简单，buildLimitFunction也可以用在别的地方。

buildLimitFunction只是一个演示用的玩具，出错的情况完全没有考虑。

应聘者答案说明
-----------

这里选出了几个应聘者答案，隐去了代码中的个人信息。

ajy (扩展) 自己实现map来控制并发数量

klg (扩展) 利用async.eachLimit，小缺点是不能始终保持并发数为5

lz (扩展) 利用async/queue

myf (扩展) 每完成一个请求安排下一个请求

nsg (扩展) 构造限制并发数的request

sjy (基本) async使用

wwx (扩展) 使用generator并以5个为一组发送请求，小缺点是不能始终保持并发数为5

zzy (扩展) 利用event
