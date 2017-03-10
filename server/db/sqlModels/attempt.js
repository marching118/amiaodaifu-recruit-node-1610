'use strict';

const Sequelize = require('sequelize');

module.exports = {
  name: 'attempt',
  fields: [{
    name: 'ip',
    sqlOptions: {
      type: Sequelize.TEXT
    }
  }, {
    name: 'mail',
    sqlOptions: {
      type: Sequelize.TEXT
    }
  }, {
    name: 'tree',
    sqlOptions: {
      type: Sequelize.TEXT
    }
  }, {
    name: 'pass',
    sqlOptions: {
      type: Sequelize.BOOLEAN
    }
  }, {
    name: 'concurrency',
    sqlOptions: {
      type: Sequelize.INTEGER
    }
  }, {
    name: 'time',
    sqlOptions: {
      type: Sequelize.INTEGER
    }
  }, {
    name: 'name',
    sqlOptions: {
      type: Sequelize.TEXT
    }
  }, {
    name: 'phone',
    sqlOptions: {
      type: Sequelize.TEXT
    }
  }, {
    name: 'sourceCode',
    sqlOptions: {
      type: Sequelize.TEXT
    }
  }, {
    name: 'forFun',
    sqlOptions: {
      type: Sequelize.BOOLEAN
    }
  }, {
    name: 'root',
    sqlOptions: {
      type: Sequelize.JSONB
    }
  }, {
    name: 'answer',
    sqlOptions: {
      type: Sequelize.JSONB
    }
  }],
  autoAddedFields: [],
  associate: (order, models) => {
  },
  indexes: [{
    fields: ['mail']
  }, {
    fields: ['ip', 'mail']
  }],
  freezeTableName: true
};
