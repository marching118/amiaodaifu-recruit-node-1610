'use strict';

const Sequelize = require('sequelize'),
  fs = require('fs'),
  path = require('path'),
  config = require('./config');

const db = {};
const sequelize = new Sequelize(config.database, config.username, config.password, config);

function defineModel(m) {
  let fieldsCfg = {};
  m.fields.forEach(f => fieldsCfg[f.name] = f.sqlOptions);
  return sequelize.define(m.name, fieldsCfg, {
    freezeTableName: m.freezeTableName,
    paranoid: m.paranoid,
    indexes: m.indexes,
    classMethods: {
      associate: m.associate
    }
  });
}

const models = fs
  .readdirSync(path.join(__dirname, 'sqlModels'))
  .filter(f => f.endsWith('.js'))
  .map(f => require(path.join(__dirname, 'sqlModels', f)))
  .filter(m => typeof m === 'object')
  .map(defineModel);

models.forEach(model => db[model.name] = model);
models.forEach(model => model.associate ? model.associate(model, db) : null);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
