var DDoc = require('../../lib/ddoc')
  , Doc = require('../../lib/doc')

module.exports = {
  targets: {
    dev: { url: 'http://localhost:5984/dev' },
    prod: {
      url: 'http://notch.couchone.com/prod',
      auth: 'user:password'
    }
  },
  ddocs: {
    blog: new DDoc('blog')
  },
  models: {
    post: Doc.extend(null, {
      schema: {
        properties: {
          title: { type: 'string' }
        }
      }        
    })
  }
};

