var Env = require('./lib/env')
  , Client = require('./lib/client')
  , Doc = require('./lib/doc')
  , DDoc = require('./lib/ddoc');

module.exports = {
  Env: Env,
  Client: Client,
  Doc: Doc,
  DDoc: DDoc
};

module.exports.createDDoc = function (id) {
  return new DDoc(id);
};

module.exports.createClient = function () {
  return new Client(new Env());
};
