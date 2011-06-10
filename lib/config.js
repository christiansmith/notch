var fs = require('fs');

module.exports = {

  load: function (file) {
    return JSON.parse(fs.readFileSync(file));
  },

};
