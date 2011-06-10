var Client = require('./lib/client')
  , DDoc = require('./lib/ddoc')
  , config = require('./lib/config').load('config.json');

module.exports = {
  Client: Client,
  DDoc: DDoc,
  config: config
};

module.exports.createDDoc = function (id) {
  return new DDoc(id);
};

module.exports.createClient = function () {
  return new Client(this.config);
};
