var load = require('../lib/load')
  , expand = load.expand
  , walk = load.walk
  , filters = load.filters
  , loaders = load.loaders
  , fs = require('fs');


describe('type', function() {
  it('should derive type from properties', function() {
    ['attachments', 'files', 'modules', 'json'].forEach(function (prop) {
      options = {};
      options[prop] = 'some/path';
      expect(load.type(options)).toEqual(prop);
    });
  });
});  

describe('expand', function() {
  describe('options', function() {
    beforeEach(function() {
      options = expand('doesntmatter', {});
    });

    it('should define type', function() {
      expect(options.type).toBeDefined();
    });

    it('should set root to current directory', function() {
      expect(options.root).toEqual(process.cwd());
    });

    it('should define base', function() {
      expect(options.base).toBeDefined();
    });
    
    it('should define dir', function() {
      expect(options.dir).toBeDefined();
    });
  });  

  describe('with string argument', function() {
    beforeEach(function() {
      options = expand('path/to/dir');
    });

    it('should set type to files', function() {
      expect(options.type).toEqual('files');
    });
    
    it('should set base to the parent of last subdir', function() {
      expect(options.base).toContain('path/to');
      expect(options.base).not.toContain('dir');
    });

    it('should set dir to the last subdir', function() {
      expect(options.dir).toEqual('dir');
    });
  });  
  
  describe('with string argument of `_attachments`', function() {
    it('should set type to attachments', function() {
      options = expand('_attachments');
      expect(options.type).toEqual('attachments');
    });
  });  
  
  describe('options type of `attachments`', function() {
    beforeEach(function() {
      options = expand('_attachments');
    });
    
    it('should set base to dir', function() {
      expect(options.base).toContain('_attachments');
    });

    it('should set dir to `.`', function() {
      expect(options.dir).toEqual('.');
    });
  });  
  
  describe('with object argument', function() {
    beforeEach(function() {
      options = expand({ modules: 'path/to/modules' });
    });
    
    it('should infer type from options', function() {
      expect(options.type).toEqual('modules');
    });
    
    it('should set base to the parent of the last subdir', function () {
      expect(options.base).toContain('path/to');
      expect(options.base).not.toContain('modules');
    });

    it('should set dir to the last subdir', function () {
      expect(options.dir).toEqual('modules');
    });
  });  

  describe('with string and object arguments', function() {
    beforeEach(function() {
      options = expand('path/to/stuff', { modules: 'path/to/stuff' });
    });
    
    it('should infer type from options', function() {
      expect(options.type).toEqual('modules');
    });
  });  
  
});  

describe('walk', function() {
  beforeEach(function() {
    mockfs = {
      path: {
        to: {
          'file.ext': 'Content of file.ext'
        }
      },
      'some.json': '{"foo":"bar"}'
    };

    spyOn(fs, 'readdirSync').andCallFake(readdirSync);
    spyOn(fs, 'statSync').andCallFake(statSync);
    
  });
  
  it('should make an array of filepaths', function() {
    files = walk('path');
    expect(files[0]).toContain('path/to/file.ext');
  });

  it('should handle filespaths in addition to directories', function (){
    files = walk('some.json');
    expect(files[0]).toContain('some.json');
        
  });
});  

describe('filters', function() {
  describe('jade', function() {
    it('should render jade templates', function() {
      template = '!!! 5\nhtml';
      rendered = filters['.jade'](template, {});
      expect(rendered).toContain('DOCTYPE');
      expect(rendered).toContain('html');
    });
  });  

  describe('stylus', function() {
    it('should render stylus to css', function() {
     styl = 'body\n  font 12px Helvtica, Arial, sans-serif'
     css = filters['.styl'](styl, {});
     expect(css).toContain(':');
     expect(css).toContain(';');
     expect(css).toContain('{');
    });
  });  
});  


describe('default loader', function() {
  beforeEach(function() {
    files = {
      'path/to/file.ext': 'stuff',
      'path/to/index.jade': '!!! 5\nhtml\n  p!= foo'
    };
    spyOn(fs, 'readFileSync').andCallFake(function (file) {
      return new Buffer(files[file]);  
    });
  });
  
  it('should load a file into an object chain', function() {
    doc = {};
    loaders.default(doc, 'path/to/file.ext', { type: 'files' });
    expect(doc.path.to['file.ext']).toEqual('stuff');
  });

  it('should drop the file extension for modules', function() {
    doc = {};
    loaders.default(doc, 'path/to/file.ext', { type: 'modules' });
    expect(doc.path.to.file).toEqual('stuff');
  });

  it('should filter data by extension', function() {
    loaders.default(doc, 'path/to/index.jade', { 
      type: 'modules', 
      locals: { foo: 'bar' }
    });
    data = doc.path.to.index;
    expected = '<!DOCTYPE html><html><p>bar</p></html>';
    expect(data).toEqual(expected);
  });
});  

describe('attachment loader', function() {
  beforeEach(function() {
    doc = { _attachments: {} };
    options = { locals: { foo: 'bar' }}
    files = {
      'path/to/attachment.js': 'data',
      'path/to/index.jade': '!!! 5\nhtml\n  p!= foo'
    }
    spyOn(fs, 'readFileSync').andCallFake(function (file) {
      return new Buffer(files[file]);
    });
    loaders.attachments(doc, 'path/to/attachment.js', options);
  });
  
  it('should identify the attachment with its filepath', function() {
    expect(doc._attachments['path/to/attachment.js']).toBeDefined();
  });

  it('should determine content type', function() {
    expect(doc._attachments['path/to/attachment.js'].content_type)
          .toEqual('application/javascript');
  });

  it('should encode data as base64', function() {
    expect(doc._attachments['path/to/attachment.js'].data)
          .toEqual(new Buffer('data').toString('base64'));
  });

  it('should replace the file extension', function() {
    loaders.attachments(doc, 'path/to/index.jade', options);
    expect(doc._attachments['path/to/index.html']).toBeDefined();
  });
  
  it('should filter data by extension', function () {
    loaders.attachments(doc, 'path/to/index.jade', options);
    data = doc._attachments['path/to/index.html'].data;
    expected = new Buffer('<!DOCTYPE html><html><p>bar</p></html>').toString('base64');
    expect(data).toEqual(expected);
  });
});  

describe('json loader', function() {
  beforeEach(function() {
    doc = {};
    schema = JSON.stringify({ properties: { foo: { type: 'string' } } });
    spyOn(fs, 'readFileSync').andReturn(new Buffer(schema));
  });
    
  it('should parse JSON from files', function() {
    loaders.json(doc, 'schemas/profile.json', {});
    expect(doc.schemas.profile).toEqual(JSON.parse(schema));
  });
});  


describe('load', function() {
  var doc, mockfs;
  beforeEach(function() {
    doc = {
      _attachments: {},
      load: load
    };

    /*
    mockfs = {
      '.': {
        'index.jade': '!!! 5\nhtml',
        'styles': {
          'screen.css': 'body: { color: #999; }'
        }
      },
      fake_modules: {
        lib: {
          'index.js': 'module.exports = {}'
        }
      },
      'fake_files': {
        'dir': {
          'README.md': 'nothing to see here',
          'subdir': {
            'whatever.ext': 'I need a life'
          }
        }
      }
    };
    */
    mockfs = {
      fake_modules: {
        lib: {
          'index.js': 'module.exports = {}'     
        }
      }
    };

    //spyOn(process, 'chdir');
    //spyOn(fs, 'readdirSync').andCallFake(readdirSync);
    //spyOn(fs, 'statSync').andCallFake(statSync);
    //spyOn(fs, 'readFileSync').andCallFake(readFileSync);
  });
  
  describe('modules', function() {
    it('should load modules', function() {
      //doc.load({ modules: 'node_modules' });
      //expect(doc.node_modules.jade.lib.utils).toBeDefined();
    });
    
  });  
  

  describe('attachments', function() {
    it('with string', function() {
      //doc.load({ attachments: '.'});

      //expect(doc._attachments['index.html'].data).toBeDefined();
    });
    
  });  
  
});  



describe('load attachments', function() {
  beforeEach(function() {
    doc = {
      _attachments: {},
      load: load
    };
  });

  it('with string arg', function() {
    //doc.load('_attachments', { locals: { description: 'hello' }});
    //expect(doc._attachments['index.html'].data).toBeDefined();
  });
  
  it('with object arg', function() {
    //doc.load({
    //  attachments: '_attachments',
    //  locals: { description: 'HELLO' }
    //});
    //expect(doc._attachments['index.html'].data).toBeDefined();
  });

  //
  //
  //
  //
  //
  //

});  


function traverse (filepath, dir) {
  var nodes = filepath.split('/')
    , current = nodes.shift();

  if (nodes.length == 0) {
    return dir[current];
  } else {
    return traverse(nodes.join('/'), dir[current]);
  }
}

function readdirSync(dirpath) {
  var directory = traverse(dirpath, mockfs);
  return Object.keys(directory);
}

function statSync(filepath) {
  var directory = traverse(filepath, mockfs);
  return (function (dir) {
    return {
      isFile: function () {
        return (typeof dir == 'string');
      },
      isDirectory: function () {
        return (typeof dir == 'object' && !!dir);
      }
    };
  })(directory);
}

function readFileSync (pth) {
  var file = traverse(pth, mockfs);
  return new Buffer(file);
}
