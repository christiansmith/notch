var Client = require('./lib/client')
  , DDoc = require('./lib/ddoc');

module.exports = {
  Client: Client,
  DDoc: DDoc
};

module.exports.createDDoc = function (id) {
  return new DDoc(id);
};

module.exports.createClient = function (config) {
  return new Client(config);
};
