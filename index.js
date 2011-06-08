module.exports = require('./lib/client');
module.exports.DDoc = DDoc = require('./lib/ddoc');

module.exports.createDDoc = function (id) {
  return new DDoc(id);
};
