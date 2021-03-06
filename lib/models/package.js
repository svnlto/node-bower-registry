//
// models.package
//

var db = require('../db/couch'),
    _ = require('lodash'),
    Validotron = require('validotron');


//
// Model Object
//
var Model = function (data) {

  'use strict';

  data = data || {};

  this._model = {
    resource: 'packages',
    _id: _.has(data, 'name') ? data.name: undefined,
    name: _.has(data, 'name') ? data.name: undefined,
    version: _.has(data, 'version') ? data.version: undefined,
    main: _.has(data, 'main') ? data.main: undefined,
    url: _.has(data, 'url') ? data.url: undefined,
    ignore: _.has(data, 'ignore') ? data.ignore: undefined,
    dependencies: _.has(data, 'dependencies') ? data.dependencies: undefined,
    devDependencies: _.has(data, 'devDependencies') ? data.devDependencies: undefined
  };

};

//
// Model factory
//
// creates a new instance of the model with whatever
// data is being passed in.
//

Model.factory = function (data) {

  'use strict';

  return new Model(data);
};


//
// Model validation
//

Model.prototype.validate = function() {

  'use strict';

  this.errors = undefined;

  var validation = new Validotron({
    name: {
      data: this._model._id,
      presence: true
    },
    url: {
      data: this._model.url,
      format: {
        "with": "^(git|https):\/\/"
      }
    }
  });

  this.errors = validation.errors;

};


//
// list Method
//
Model.list = function(callback) {

  'use strict';

  db.view('packages', 'byDate', {descending: true}, function (err, data) {
    var payload = [];

    if (err) { return callback(err); }

    data.rows.forEach(function(doc) {
      payload.push(_.pick(doc.value, 'name', 'url'));
    });

    return callback(null, payload);

  });

};


//
// search Method
//
Model.search = function(name, callback) {

  'use strict';

  db.search('packages', 'packages', { q: name }, function(err, doc) {
    var payload = [];
    if (err) { return callback(err, null); }

    if (doc.rows.length === 0) {
      return callback(null, payload);
    } else {
      doc.rows.forEach(function(doc) {
        payload.push(doc.fields);
      });

      return callback(null, payload);
    }
  });

};


//
// find Method
//
Model.find = function(id, callback) {

  'use strict';

  if (id) {
    db.get(id, function (err, data) {
      if (err) { return callback(err); }

      return callback(null, _.pick(data, 'name', 'url'));
    });
  }

};

//
// save Method
//
Model.prototype.save = function(callback) {

  'use strict';

  var _model = this._model;

  this.validate();

  if (this.errors && !_.isEmpty(this.errors)) {
    return callback(this.errors, false);
  }

  _model.ctime = new Date().toISOString();

  db.insert(_model, function(err, res) {
    if (err) { return callback(err); }

    db.get(_model._id, function (err, data) {
      if (err) { return callback(err); }

      return callback(null, data);
    });

  });

};

module.exports = Model;
