'use strict';

const db = require('.');

db.sequelize.sync({force: true})
  .then(function () {
    process.exit(0);
  }, function (e) {
    console.log(e);
    process.exit(0);
  });
