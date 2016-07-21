
/**
 * Module dependencies.
 */

var readfile = require('fs').readFileSync;
var readdir = require('fs').readdirSync;
var coffee = require('coffee-script');
var resolve = require('path').resolve;
var exist = require('fs').existsSync;
var lstat = require('fs').lstatSync;
var cache = require('../lib/cache');
var rmrf = require('rimraf').sync;
var File = require('../lib/file');
var util = require('../lib/util');
var join = require('path').join;
var assert = require('assert');
var wait = require('co-wait');
var styl = require('styl');
var fs = require('co-fs');
var Duo = require('..');
var vm = require('vm');
var slice = [].slice;
var token = util.token();

/**
 * Tests.
 */

describe('Duo API', function () {
  beforeEach(function* () {
    yield cache.clean();
    cleanup();
  });

  after(function* () {
    yield cache.clean();
    cleanup();
  });

  it('should throw without root', function () {
    var err;
    try {
      Duo();
    } catch (e) {
      err = e;
    }
    assert(err && /root directory/.test(err.message));
  });

  it('should set default options', function () {
    var duo = Duo(__dirname);
    assert.equal(duo._root, __dirname);
    assert.equal(duo._entry, undefined);
    assert.equal(duo._manifest, 'component.json');
    assert.equal(duo._global, undefined);
    assert.equal(duo._installTo, 'components');
    assert.equal(duo._buildTo, 'build');
    assert.equal(duo._copy, false);
    assert.equal(duo._development, false);
    assert.equal(duo._concurrency, 50);
    assert.equal(duo._cache, true);
  });

  describe('.entry()', function () {
    it('should get the current entry file', function () {
      var duo = Duo(__dirname);
      duo._entry = 'entry';
      assert.equal(duo.entry(), 'entry');
    });

    it('should be classified as a local', function () {
      var duo = Duo(__dirname);
      duo.entry('path');
      var file = duo.entry();
      assert(file instanceof File);
      assert(file.local());
      assert(!file.remote());
    });
  });

  describe('.entry(path)', function () {
    it('should set the entry file by path', function () {
      var duo = Duo(__dirname);
      duo.entry('path');
      var file = duo.entry();
      assert(file instanceof File);
      assert.equal(file.path, join(__dirname, 'path'));
      assert.equal(file.entry, true);
    });
  });

  describe('.entry(source, type)', function () {
    it('should set the entry file by source and type', function () {
      var duo = Duo(__dirname);
      duo.entry('string', 'js');
      var file = duo.entry();
      assert(file instanceof File);
      assert.equal(file.raw, 'string');
      assert.equal(file.type, 'js');
    });
  });

  describe('.root()', function () {
    it('should get the root path', function () {
      var duo = Duo(__dirname);
      assert.equal(duo.root(), __dirname);
    });
  });

  describe('.root(path)', function () {
    it('should set the root path', function () {
      var duo = Duo(__dirname);
      duo.root('root');
      assert.equal(duo.root(), 'root');
    });
  });

  describe('.token()', function () {
    it('should get the token name', function () {
      var duo = Duo(__dirname);
      duo._token = 'token';
      assert.equal(duo.token(), 'token');
    });
  });

  describe('.token(name)', function () {
    it('should set the token name', function () {
      var duo = Duo(__dirname);
      duo.token('secret');
      assert.equal(duo.token(), 'secret');
    });
  });

  describe('.manifest()', function () {
    it('should get the manifest name', function () {
      var duo = Duo(__dirname);
      assert.equal(duo.manifest(), 'component.json');
    });
  });

  describe('.manifest(name)', function () {
    it('should set the manifest name', function () {
      var duo = Duo(__dirname);
      duo.manifest('package.json');
      assert.equal(duo.manifest(), 'package.json');
    });
  });

  describe('.global()', function () {
    it('should get the global name', function () {
      var duo = Duo(__dirname);
      duo._global = 'global';
      assert.equal(duo.global(), 'global');
    });
  });

  describe('.global(name)', function () {
    it('should set the global name', function () {
      var duo = Duo(__dirname);
      duo.global('package.json');
      assert.equal(duo.global(), 'package.json');
    });
  });

  describe('.development()', function () {
    it('should get whether to build with development dependencies', function () {
      var duo = Duo(__dirname);
      assert.equal(duo.development(), false);
    });
  });

  describe('.development(name)', function () {
    it('should set whether to build with development dependencies', function () {
      var duo = Duo(__dirname);
      duo.development(true);
      assert.equal(duo.development(), true);
    });
  });

  describe('.copy()', function () {
    it('should get whether to copy files instead of symlinking', function () {
      var duo = Duo(__dirname);
      assert.equal(duo.copy(), false);
    });
  });

  describe('.copy(name)', function () {
    it('should set whether to copy files instead of symlinking', function () {
      var duo = Duo(__dirname);
      duo.copy(true);
      assert.equal(duo.copy(), true);
    });
  });

  describe('.concurrency()', function () {
    it('should get the download concurrency value', function () {
      var duo = Duo(__dirname);
      assert.equal(duo.concurrency(), 50);
    });
  });

  describe('.concurrency(value)', function () {
    it('should set the download concurrency value', function () {
      var duo = Duo(__dirname);
      duo.concurrency(1);
      assert.equal(duo.concurrency(), 1);
    });
  });

  describe('.update()', function () {
    it('should get the update flag', function () {
      var duo = Duo(__dirname);
      assert.equal(duo.update(), false);
    });
  });

  describe('.update(value)', function () {
    it('should set the update flag', function () {
      var duo = Duo(__dirname);
      duo.update(true);
      assert.equal(duo.update(), true);
      duo.update(false);
      assert.equal(duo.update(), false);
    });
  });

  describe('.cache()', function () {
    it('should get the cache flag', function () {
      var duo = Duo(__dirname);
      assert.equal(duo.cache(), true);
    });
  });

  describe('.cache(value)', function () {
    it('should set the cache flag', function () {
      var duo = Duo(__dirname);
      duo.cache(true);
      assert.equal(duo.cache(), true);
      duo.cache(false);
      assert.equal(duo.cache(), false);
    });
  });

  describe('.installTo()', function () {
    it('should get the relative path to the install directory', function () {
      var duo = Duo(__dirname);
      assert.equal(duo.installTo(), 'components');
    });

    it('should set the relative path to the install directory', function () {
      var duo = Duo(__dirname);
      duo.installTo('modules');
      assert.equal(duo.installTo(), 'modules');
    });
  });

  describe('.buildTo()', function () {
    it('should get the relative path to the build directory', function () {
      var duo = Duo(__dirname);
      assert.equal(duo.buildTo(), 'build');
    });

    it('should set the relative path to the build directory', function () {
      var duo = Duo(__dirname);
      duo.buildTo('public');
      assert.equal(duo.buildTo(), 'public');
    });
  });

  describe('.path(paths...)', function () {
    it('should resolve paths relative to the root directory', function () {
      var duo = Duo(__dirname);
      var dir = join(__dirname, 'folder');
      assert.equal(duo.path('folder'), dir);
    });
  });

  describe('.buildPath(paths...)', function () {
    it('should resolve paths relative to the build directory', function () {
      var duo = Duo(__dirname);
      var dir = join(__dirname, 'build', 'folder');
      assert.equal(duo.buildPath('folder'), dir);
    });
  });

  describe('.installPath(paths...)', function () {
    it('should resolve paths relative to the install directory', function () {
      var duo = Duo(__dirname);
      var dir = join(__dirname, 'components', 'folder');
      assert.equal(duo.installPath('folder'), dir);
    });
  });

  describe('.hash(input)', function () {
    var duo = Duo(__dirname);

    it('should hash a string into md5', function () {
      assert.equal(duo.hash('Hello World'), 'b10a8db164e0754105b7a99be72e3fe5');
    });

    it('should hash an object by serializing to JSON first', function () {
      assert.equal(duo.hash({}), '99914b932bd37a50b983c5e7c90ae93b');
    });

    it('should allow Buffers too', function () {
      assert.equal(duo.hash(new Buffer('abc')), '900150983cd24fb0d6963f7d28e17f72');
    });
  });

  describe('.cleanCache()', function () {
    it('should destroy the cache', function* () {
      var duo = build('simple-deps');
      yield duo.run();
      assert(exists('simple-deps/components/duo-cache'));
      yield duo.cleanCache();
      assert(!exists('simple-deps/components/duo-cache'));
    });

    it('should not throw an error when no cache exists', function* () {
      var duo = build('simple-deps');
      assert(!exists('simple-deps/components/duo-cache'));
      yield duo.cleanCache();
      assert(!exists('simple-deps/components/duo-cache'));
    });
  });

  describe('.include(name, src, [type])', function () {
    it('should add the specified module to the includes hash', function () {
      var duo = build('includes');
      duo.include('some-include', 'module.exports = "a"');
      assert('some-include' in duo.includes);
    });

    it('should parse the included file for dependencies (when a type is specified)', function () {
      var duo = build('includes');
      duo.include('some-include', 'require("other-include");', 'js');
      assert('other-include' in duo.includes['some-include'].deps);
    });
  });

  describe('.included(name)', function () {
    it('should tell us if something has already been included', function () {
      var duo = build('includes');
      assert(!duo.included('some-include'));
      duo.include('some-include', 'module.exports = "a"');
      assert(duo.included('some-include'));
    });
  });

  describe('.run([fn])', function () {
    it('should ignore runs without an entry or source', function* () {
      var js = yield Duo(__dirname).run();
      assert.deepEqual(js, { code: '' });
    });

    it('should build simple modules', function* () {
      var js = yield build('simple').run();
      var ctx = evaluate(js.code);
      assert.deepEqual(['one', 'two'], ctx.main);
    });

    it('should build require conflicts', function* () {
      this.timeout(10000);
      var js = yield build('require-conflict').run();
      var ctx = evaluate(js.code);
      var mod = ctx.main;
      assert(mod.send !== mod.json, 'segmentio/json == yields/send-json');
    });

    it('should build with no deps', function* () {
      var js = yield build('no-deps').run();
      var ctx = evaluate(js.code).main;
      assert.equal('a', ctx);
    });

    it('resolve directories like `require(./lib)`', function* () {
      var js = yield build('resolve').run();
      var ctx = evaluate(js.code);
      assert.deepEqual('resolved', ctx.main);
    });

    it('should resolve relative files like `require(../path/file.js`)', function* () {
      var js = yield build('resolve-file').run();
      var ctx = evaluate(js.code);
      assert.equal('resolved', ctx.main);
    });

    it('should resolve dependencies like require("..")', function* () {
      var js = yield build('relative-path', 'test/test.js').run();
      var ctx = evaluate(js.code);
      assert.equal('index', ctx.main);
    });

    it('should resolve dependencies that have dots in the name', function* () {
      var js = yield build('file-dots', 'index.js').run();
      var ctx = evaluate(js.code);
      assert.strictEqual(ctx.a1, ctx.a2);
    });

    it('should fail when relative requires are not found', function* () {
      try {
        var js = yield build('resolve-relative-missing', 'index.js').run();
      } catch (err) {
        assert(err instanceof Error);
      }
      assert(!js, 'should have failed');
    });

    it('should fail when absolute requires are not found', function* () {
      try {
        var js = yield build('resolve-absolute-missing', 'index.js').run();
      } catch (err) {
        assert(err instanceof Error);
      }
      assert(!js, 'should have failed');
    });

    it('should fetch and build direct dependencies', function* () {
      this.timeout(15000);
      var js = yield build('simple-deps').run();
      var ctx = evaluate(js.code);
      assert(ctx.mods);
      assert.equal(2, ctx.mods.length);
      assert.equal('string', ctx.mods[0](''));
      assert.equal(typeof ctx.mods[1], 'function');
    });

    it('should fetch dependencies from manifest', function* () {
      var js = yield build('manifest-deps').run();
      var ctx = evaluate(js.code);
      var type = ctx.main;
      assert.equal('string', type(''));
    });

    it('should fetch dependencies via semver ranges', function* () {
      var js = yield build('deps-semver').run();
      var ctx = evaluate(js.code).main;
      assert.equal(ctx, 'function');
    });

    it('should fail when manifest has a syntax error', function* () {
      try {
        var success = yield build('manifest-syntax-err').run();
      } catch (e) {
        assert(e instanceof SyntaxError);
      }
      assert(!success);
    });

    it('should decorate the SyntaxError object', function* () {
      try {
        var success = yield build('manifest-syntax-err').run();
      } catch (e) {
        assert(e.message.indexOf('Unexpected token }') > -1);
        assert.equal(e.fileName, path('manifest-syntax-err/component.json'));
      }
      assert(!success);
    });

    it('should be idempotent', function* () {
      var a = yield build('idempotent').run();
      var b = yield build('idempotent').run();
      var c = yield build('idempotent').run();
      a = evaluate(a.code).main;
      b = evaluate(b.code).main;
      c = evaluate(c.code).main;
      assert.equal('string', a(''));
      assert.equal('string', b(''));
      assert.equal('string', c(''));
    });

    it('should rebuild correctly when a file is touched', function* () {
      var p = join(path('rebuild'), 'index.js');
      var js = yield fs.readFile(p, 'utf8');
      var a = build('rebuild');
      var b = build('rebuild');
      var c = build('rebuild');
      a = yield a.run();
      fs.writeFile(p, js);
      b = yield b.run();
      c = yield c.run();
      assert(a.code && b.code && c.code);
      assert.equal(a.code, b.code);
      assert.equal(b.code, c.code);
    });

    it('should resolve repos with different names', function* () {
      this.timeout(15000);
      var js = yield build('different-names').run();
      var ms = evaluate(js.code).main;
      assert.equal(36000000, ms('10h'));
    });

    it('should resolve dependencies that use require("{user}-{repo}")', function* () {
      var js = yield build('user-repo-dep').run();
      var type = evaluate(js.code).main;
      assert.equal('string', type(js.code));
    });

    it('.run(fn) should work with a function', function (done) {
      build('simple').run(function (err, js) {
        assert(!err);
        var ctx = evaluate(js.code);
        assert.deepEqual(['one', 'two'], ctx.main);
        done();
      });
    });

    it('should support multiple versions in the same file', function* () {
      var js = yield build('multiple-versions').run();
      var mimes = evaluate(js.code).mimes;
      assert.equal('image/x-nikon-nef', mimes[0].lookup('.nef')); // 0.0.2
      assert.equal(null, mimes[1].lookup('.nef')); // 0.0.1
      assert.equal('image/jpeg', mimes[1].lookup('.jpg'));
    });

    it('should properly mark local and remote files', function* () {
      var duo = build('local-vs-remote');

      duo.use(function test(file) {
        switch (file.id) {
        case 'index.js':
        case 'local.js':
          assert(file.local());
          break;

        case 'components/component-to-function@2.0.5/index.js':
        case 'components/component-props@1.1.2/index.js':
          assert(file.remote());
          break;

        default:
          throw new Error('unhandled file ' + file.id);
        }
      });

      yield duo.run();
    });

    it('should properly mark local and remote files even when installed somewhere else', function* () {
      var duo = build('local-vs-remote');
      duo.installTo('not components');

      duo.use(function test(file) {
        switch (file.id) {
          case 'index.js':
          case 'local.js':
            assert(file.local());
            break;

          case 'not components/component-to-function@2.0.5/index.js':
          case 'not components/component-props@1.1.2/index.js':
            assert(file.remote());
            break;

          default:
            throw new Error('unhandled file ' + file.id);
          }
      });

      yield duo.run();
    });

    it('should update dependencies when the manifest changes', function* () {
      var duo = build('manifest-modify');

      var a = path('manifest-modify', 'component-a.json');
      var b = path('manifest-modify', 'component-b.json');
      var manifest = path('manifest-modify', 'component.json');

      // write manifest a
      yield fs.writeFile(manifest, yield fs.readFile(a, 'utf8'));
      var adeps = yield duo.install();

      yield wait(1000); // need to wait so mtime changes

      // write manifest b
      yield fs.writeFile(manifest, yield fs.readFile(b, 'utf8'));
      var bdeps = yield duo.install();

      // assertions
      assert.notDeepEqual(Object.keys(adeps), Object.keys(bdeps));

      // cleanup
      yield fs.unlink(manifest);
    });

    describe('with .entry(path)', function () {
      it('should work with full paths for entry files', function* () {
        var entry = join(path('simple'), 'index.js');
        var js = yield build('simple', entry).run();
        var ctx = evaluate(js.code);
        assert.deepEqual(['one', 'two'], ctx.main);
      });

      it('should throw if the entry file doesn\'t exist', function* () {
        var duo = Duo(__dirname).entry('zomg.js');

        try {
          yield duo.run();
        } catch (e) {
          assert(~e.message.indexOf('cannot find entry: zomg.js'));
        }
      });

      it('should treat entries idempotently', function* () {
        var root = path('simple');
        var duo = Duo(root).entry('hi.js');
        duo.entry('index.js');
        var js = yield duo.run();
        var ctx = evaluate(js.code);
        assert.deepEqual(['one', 'two'], ctx.main);
        var json = yield mapping(duo);
        assert.equal(true, json['index.js'].entry);
      });
    });

    describe('with .entry(source, type)', function () {
      it('should support passing raw source for entry files', function* () {
        var src = read('simple/index.js');
        var root = path('simple');
        var duo = Duo(root).entry(src, 'js');
        var js = yield duo.run();
        var ctx = evaluate(js.code);
        assert.deepEqual(['one', 'two'], ctx.main);
      });

      it('should support passing transformed raw source for entry files', function* () {
        var src = read('coffee/index.coffee');
        var root = path('coffee');
        var duo = Duo(root).use(cs).entry(src, 'coffee');
        var js = yield duo.run();
        var ctx = evaluate(js.code).main;
        assert.equal(ctx.a, 'a');
        assert.equal(ctx.b, 'b');
        assert.equal(ctx.c, 'c');
      });

      it('should not fail when the input source code is empty', function* () {
        yield Duo(path('simple')).entry('', 'css').run();
      });
    });

    // describe('with .development(false)');

    describe('with .development(true)', function () {
      it('should fetch and bundle development dependencies', function* () {
        this.timeout(20000);
        var duo = build('simple-dev-deps');
        duo.development(true);
        var js = yield duo.run();
        var ctx = evaluate(js.code);
        assert.equal('trigger', ctx.mods[0].name);
        assert.equal(typeof ctx.mods[1].equal, 'function');
      });
    });

    describe('with .sourceMap(false)', function () {
      it('should not generate sourcemaps', function* () {
        var js = yield build('simple').run();
        assert.equal(js.code.indexOf('//# sourceMappingURL'), -1);
        assert(!js.map);
      });
    });

    describe('with .sourceMap(true)', function () {
      it('should generate sourcemaps', function* () {
        var duo = build('simple').sourceMap(true);
        var js = yield duo.run();
        assert(js.code.indexOf('//# sourceMappingURL') > -1);
        assert(js.map);
      });
    });

    describe('with .sourceMap("inline")', function () {
      it('should generate sourcemaps', function* () {
        var duo = build('simple').sourceMap('inline');
        var js = yield duo.run();
        assert(js.code.indexOf('//# sourceMappingURL') > -1);
        assert(!js.map);
      });
    });

    describe('with .copy(false)', function () {
      it('should symlink files', function* () {
        var duo = build('symlink', 'index.css');
        var file = path('symlink/build/duo.png');
        var out = read('symlink/index.out.css');
        var css = yield duo.run();
        assert.equal(css.code, out);
        var stat = yield fs.lstat(file);
        assert(stat.isSymbolicLink());
      });
    });

    describe('with .copy(true)', function () {
      it('should copy files instead of symlink', function* () {
        var duo = build('copy', 'index.css').copy(true);
        var file = path('copy/build/duo.png');
        var out = read('copy/index.out.css');
        var css = yield duo.run();
        assert.equal(css.code, out);
        var stat = yield fs.lstat(file);
        assert(!stat.isSymbolicLink());
      });

      it('should not empty the target file when symlinked then copied. fixes: #356', function* () {
        // symlink
        var duo = build('copy', 'index.css').copy(false);
        var original = read('copy/duo.png');
        var file = path('copy/build/duo.png');
        var css = yield duo.run();
        assert(css);
        var stat = yield fs.lstat(file);
        assert.equal(original, read(file));
        assert(stat.isSymbolicLink());

        // copy
        duo = build('copy', 'index.css').copy(true);
        css = yield duo.run();
        stat = yield fs.lstat(file);
        assert(!stat.isSymbolicLink());
        assert.equal(original, read(file));
        assert.equal(original, read('copy/duo.png'));
      });
    });

    describe('with .global(name)', function () {
      it('should expose the entry as a global', function* () {
        var duo = build('global');
        duo.global('global-module');
        var js = yield duo.run();
        var ctx = evaluate(js.code);
        assert.equal(ctx['global-module'], 'global module');
      });
    });

    describe('with .cache(false)', function () {
      it('should have an empty mapping', function* () {
        var duo = build('idempotent').cache(false);
        yield duo.run();
        assert.deepEqual(duo.mapping, {});
      });
    });

    describe('with .use(fn|gen)', function () {
      it('should transform entry files', function* () {
        var duo = build('coffee', 'index.coffee');
        duo.use(cs);
        var js = yield duo.run();
        var ctx = evaluate(js.code).main;
        assert.equal(ctx.a, 'a');
        assert.equal(ctx.b, 'b');
        assert.equal(ctx.c, 'c');
      });

      it('should transform deps', function* () {
        var duo = build('coffee-deps');
        duo.use(cs);
        var js = yield duo.run();
        var ctx = evaluate(js.code).main;
        assert.equal(ctx.a, 'a');
        assert.equal(ctx.b, 'b');
        assert.equal(ctx.c, 'c');
      });

      it('should work with generators', function* () {
        var duo = build('coffee', 'index.coffee');
        var called = false;
        duo.use(cs).use(function* () { called = true; });
        var js = yield duo.run();
        var ctx = evaluate(js.code).main;
        assert.equal(ctx.a, 'a');
        assert.equal(ctx.b, 'b');
        assert.equal(ctx.c, 'c');
        assert(called);
      });

      it('should work async', function* () {
        var duo = build('no-deps');
        var called = false;
        duo.use(function (file, entry, fn) {
          setTimeout(function () {
            called = true;
            fn();
          }, 30);
        });

        yield duo.run();
        assert(called);
      });

      it('should work sync', function* () {
        var duo = build('no-deps');
        var called = false;
        duo.use(function () {
          called = true;
        });
        yield duo.run();
        assert(called);
      });

      it('should be idempotent across duos', function () {
        var a = build('simple');
        var b = build('no-deps');

        // plugins
        a.use(function ap() {});
        b.use(function bp() {});

        assert.equal(1, a.plugins.fns.length);
        assert.equal(1, b.plugins.fns.length);
      });
    });

    describe('with .use(alt)', function () {
      it('should support calling "alternate" plugins on the resulting build', function* () {
        var plugin = require(path('alt-plugin/plugin.js'));
        var duo = build('alt-plugin').use(plugin);
        var results = yield duo.run();
        assert(/^\"use strict";\n\n/.test(results.code));
      });
    });

    describe('with .include(name, source)', function () {
      it('should include a string as a source', function* () {
        var duo = build('includes');
        duo.include('some-include', 'module.exports = "a"');
        var js = yield duo.run();
        var ctx = evaluate(js.code).main;
        assert.equal(ctx, 'a');
      });

      it('should be idempotent', function* () {
        var duo = build('includes');
        duo.include('some-include', 'module.exports = "a"');

        var js = yield duo.run();
        var ctx = evaluate(js.code).main;
        assert.equal(ctx, 'a');

        js = yield duo.run();
        ctx = evaluate(js.code).main;
        assert.equal(ctx, 'a');
      });
    });

    describe('with bundles', function () {
      it('should support multiple bundles', function* () {
        this.timeout(10000);
        var one = build('bundles', 'one.js');
        var two = build('bundles', 'two.js');
        var onejs = yield one.run();
        var twojs = yield two.run();
        var ms = evaluate(onejs.code).main;
        var type = evaluate(twojs.code).main;
        assert.equal(36000000, ms('10h'));
        assert.equal('string', type(''));

        // Ensure both bundles are in the manifest
        var json = yield mapping(one);
        assert(json['one.js'], 'one.js not found in manifest');
        assert(json['two.js'], 'two.js not found in manifest');

        // don't let pack change the IDs of the deps
        assert.equal(typeof json['one.js'].deps.ms, 'string');
        assert.equal(typeof json['two.js'].deps.type, 'string');
      });
    });

    describe('with css', function () {
      it('should work with no deps', function* () {
        var duo = build('css-no-deps', 'index.css');
        var css = yield duo.run();
        var out = read('css-no-deps/index.out.css');
        assert.equal(css.code, out);
      });

      it('should resolve relative files', function* () {
        var duo = build('css-relative-files', 'index.css');
        var css = yield duo.run();
        var out = read('css-relative-files/index.out.css');
        assert.equal(css.code, out);
      });

      it('should resolve files with hashes and querystrings', function* () {
        var duo = build('css-hash-query-files', 'index.css');
        var css = yield duo.run();
        var out = read('css-hash-query-files/index.out.css');
        assert.equal(css.code.trim(), out.trim());
      });

      it('should support entry css transforms', function* () {
        var duo = build('css-styl', 'index.styl');
        duo.use(stylus);
        var css = yield duo.run();
        var out = read('css-styl/index.out.css');
        assert.equal(css.code.trim(), out.trim());
      });

      it('should support css transforms', function* () {
        var duo = build('css-styl-deps', 'index.css');
        duo.use(stylus);
        var css = yield duo.run();
        var out = read('css-styl-deps/index.out.css');
        assert.equal(css.code, out);
      });

      it('should load a simple dep', function* () {
        this.timeout(15000);
        var duo = build('css-simple-dep', 'index.css');
        var css = yield duo.run();
        var out = read('css-simple-dep/index.out.css');
        assert.equal(css.code.trim(), out.trim());
      });

      it('should work with user/repo@ref:path', function* () {
        this.timeout(15000);
        var duo = build('user-repo-ref-path', 'index.css');
        var css = yield duo.run();
        var out = read('user-repo-ref-path/index.out.css');
        assert.equal(css.code.trim(), out.trim());
      });

      it('should work with empty deps', function* () {
        var duo = build('empty-css-file', 'index.css');
        var css = yield duo.run();
        var out = read('empty-css-file/index.out.css');
        assert.equal(css.code, out);
      });

      it('should ignore http deps', function* () {
        var duo = build('css-http-dep', 'index.css');
        var css = yield duo.run();
        var out = read('css-http-dep/index.out.css');
        assert.equal(css.code, out);
      });

      it('should ignore image urls if asset is local', function* () {
        var duo = build('css-url', 'lib/inline.css');
        var css = yield duo.run();
        var out = read('css-url/index.out.css');
        assert.equal(css.code, out);
      });

      it('should keep duplicate references to assets', function* () {
        var duo = build('css-dup-asset', 'index.css');
        var css = yield duo.run();
        var out = read('css-dup-asset/index.out.css');
        assert.equal(css.code.trim(), out.trim());
      });

      it('should ignore unresolved remote paths', function* () {
        var duo = build('css-ignore-unresolved', 'index.css');
        var css = yield duo.run();
        var out = read('css-ignore-unresolved/index.out.css');
        assert.equal(css.code, out);
      });
    });

    describe('with json', function () {
      it('should load json files', function* () {
        var duo = build('json-dep');
        var js = yield duo.run();
        var ctx = evaluate(js.code).main;
        assert.equal(1, ctx.a);
        assert.equal(2, ctx.b);
      });
    });

    describe('with components', function () {
      it('should build multi-asset components', function* () {
        this.timeout(15000);

        var duo = build('js-css-dep');
        var js = yield duo.run();
        var ctx = evaluate(js.code).main;
        assert(ctx({}).dom);

        duo = build('js-css-dep', 'index.css');
        var out = read('js-css-dep/index.out.css');
        var css = yield duo.run();
        assert.equal(css.code.trim(), out.trim());
      });

      it('should build components with a main object', function* () {
        var duo = build('main-obj');
        var js = yield duo.run();
        var ctx = evaluate(js.code).main;
        assert.equal('local', ctx);

        duo = build('main-obj', 'index.css');
        var out = read('main-obj/index.out.css');
        var css = yield duo.run();
        assert.equal(css.code.trim(), out.trim());
      });

      it('should work on a full hybrid that triggers css-compat', function* () {
        this.timeout(20000);
        var duo = build('hybrid-full');

        // TODO: figure out how to simulate a browser-like
        // environment to run this code. For now we're just
        // ensuring nothing throws.
        yield duo.run();

        duo = build('hybrid-full', 'index.css');
        var css = yield duo.run();

        // this is more resistent to version changes
        var menu = css.code.indexOf('.menu {');
        var dropdown = css.code.indexOf('.dropdown-link {');
        var body = css.code.indexOf('.hybrid-full {');

        // test order
        assert(body > dropdown > menu > -1);
      });
    });

    describe('with mapping', function () {
      it('should contain keys from all instances', function* () {
        var a = build('concurrent-mapping', 'index.css');
        var b = build('concurrent-mapping');
        yield [a.run(), b.run()];
        var json = yield mapping(a);
        var keys = Object.keys(json).sort();
        assert.equal(keys[0], 'components/component-emitter@1.1.3/index.js');
        assert.equal(keys[1], 'components/component-type@1.0.0/index.js');
        assert.equal(keys[2], 'components/necolas-normalize.css@3.0.2/normalize.css');
        assert.equal(keys[3], 'index.css');
        assert.equal(keys[4], 'index.js');
      });

      it('should have entry keys for entry files', function* () {
        var a = build('entries', 'index.js');
        var b = build('entries', 'admin.js');
        yield [a.run(), b.run()];
        var json = yield mapping(a);
        assert.equal(true, json['index.js'].entry);
        assert.equal(true, json['admin.js'].entry);
      });
    });

    describe('with symlinks', function () {
      it('should symlink images', function* () {
        var duo = build('symlink-assets', 'index.css');
        var css = yield duo.run();
        var out = read('symlink-assets/index.out.css');
        assert.equal(css.code, out);

        var imgpath = path('symlink-assets', 'build', 'badgermandu.jpg');
        var symlink = read('symlink-assets/build/badgermandu.jpg');
        var img = read('symlink-assets/badgermandu.jpg');
        assert(isSymlink(imgpath));
        assert.equal(symlink, img);
      });
    });
  });

  describe('.write([fn])', function () {
    it('should write files to duo.assetPath', function* () {
      var duo = build('simple');
      yield duo.write();
      var js = read('simple/build/index.js');
      var ctx = evaluate(js);
      assert.deepEqual(['one', 'two'], ctx.main);
    });

    it('should support .write(fn)', function (done) {
      var duo = build('simple-deps');
      duo.write(function (err) {
        if (err) return done(err);
        var js = read('simple-deps/build/index.js');
        var ctx = evaluate(js);
        assert(ctx.mods);
        assert.equal(2, ctx.mods.length);
        assert.equal('string', ctx.mods[0](''));
        assert(typeof ctx.mods[1], 'function');
        done();
      });
    });

    it('should support a path', function* () {
      var duo = build('simple');
      var out = join(path('simple'), 'build.js');
      yield duo.write(out);
      var js = read('simple/build.js');
      var ctx = evaluate(js);
      assert.deepEqual(['one', 'two'], ctx.main);
      rmrf(out);
    });

    it('should support .write(path, fn)', function (done) {
      var duo = build('simple');
      var out = join(path('simple'), 'build.js');

      duo.write(out, function (err) {
        if (err) return done(err);
        var js = read('simple/build.js');
        var ctx = evaluate(js);
        assert.deepEqual(['one', 'two'], ctx.main);
        rmrf(out);
        done();
      });
    });

    it('should change type if duo.entryFile\'s type changes', function* () {
      var expected = read('css-styl/index.out.css');
      var duo = build('css-styl', 'index.styl');
      duo.use(stylus);
      yield duo.write();
      var css = read('css-styl/build/index.css');
      assert.equal(expected.trim(), css.trim());
    });

    it('should bundle assets', function* () {
      this.timeout(10000);
      var expected = read('css-assets/index.out.css');
      var duo = build('css-assets', 'index.css');
      yield duo.write();
      var css = read('css-assets/build/index.css');
      assert.equal(expected.trim(), css.trim());
      assert(exists('css-assets/build/components/duojs-logo@0.0.2/images/logo.svg'));
    });

    it('should bundle assets even if in the cache', function* () {
      var expected = read('css-assets/index.out.css');
      var duo = build('css-assets', 'index.css');
      yield duo.write();
      duo.buildTo('out');
      yield duo.write('index.css');
      var css = read('css-assets/out/index.css');
      assert.equal(expected.trim(), css.trim());
      assert(exists('css-assets/out/components/duojs-logo@0.0.2/images/logo.svg'));
      rmrf(path('css-assets/out'));
    });

    describe('with .installTo(directory)', function () {
      it('should write to the installation directory', function* () {
        var duo = build('simple-deps');
        duo.installTo('deps');
        yield duo.write();
        assert(exists('simple-deps/deps'));
        assert(exists('simple-deps/deps/duo-cache'));
        rmrf(path('simple-deps', 'deps'));
      });
    });

    describe('with .sourceMap(false)', function () {
      it('should not generate any sourcemaps', function* () {
        var duo = build('simple');
        yield duo.write();
        var src = yield fs.readFile(path('simple', 'build/index.js'), 'utf8');
        assert(exists('simple/build/index.js'));
        assert.equal(src.indexOf('//# sourceMappingURL='), -1); // inline
        assert(!exists('simple/build/index.js.map'));           // external
      });
    });

    describe('with .sourceMap(true)', function () {
      it('should generate external sourcemaps', function* () {
        var duo = build('simple').sourceMap(true);
        yield duo.write();
        var src = yield fs.readFile(path('simple', 'build/index.js'), 'utf8');
        assert(exists('simple/build/index.js'));
        assert(src.indexOf('//# sourceMappingURL=index.js.map') > -1); // link
        assert(exists('simple/build/index.js.map'));
      });
    });

    describe('with .sourceMap("inline")', function () {
      it('should generate inline sourcemaps', function* () {
        var duo = build('simple').sourceMap('inline');
        yield duo.write();
        var src = yield fs.readFile(path('simple', 'build/index.js'), 'utf8');
        assert(exists('simple/build/index.js'));
        assert(src.indexOf('//# sourceMappingURL=') > -1);
        assert(!exists('simple/build/index.js.map'));
      });
    });
  });
});

/**
 * Build a `fixture` with an optional entry `file`, and return the built source.
 *
 * @param {String} fixture
 * @return {String}
 */

function build(fixture, file) {
  var root = path(fixture);
  var duo = Duo(root).entry(file || 'index.js').token(token);
  return duo;
}

/**
 * Resolve the path to a fixture.
 *
 * @param {String} paths...
 * @return {String}
 */

function path() {
  var paths = slice.call(arguments);
  return join.apply(null, [__dirname, 'fixtures'].concat(paths));
}

/**
 * Check if a `file` exists.
 *
 * @param {String} file
 * @return {Boolean}
 */

function exists(file) {
  return exist(path(file));
}

/**
 * Evaluate a Javascript `string` with `ctx`.
 *
 * @param {String} string
 * @param {Object} ctx
 * @return {Object}
 */

function evaluate(js, ctx) {
  if (!ctx) ctx = { window: {}, document: {} };
  vm.runInNewContext('main =' + js + '(1)', ctx, 'main.vm');
  vm.runInNewContext('require =' + js + '', ctx, 'require.vm');
  return ctx;
}

/**
 * Cleanup after the tests.
 */

function cleanup() {
  var dir = join(__dirname, 'fixtures');
  var dirs = readdir(dir);
  dirs.forEach(function (name) {
    if (name[0] === '.') return;
    var components = join(dir, name, 'components');
    var build = join(dir, name, 'build');
    rmrf(components);
    rmrf(build);
  });
}

/**
 * Get the mapping from a `fixture`.
 *
 * @param {String} fixture
 * @return {Object}
 */

function* mapping(duo) {
  var cache = yield duo.getCache();
  return yield cache.read();
}

/**
 * Read a fixture file by `path`.
 *
 * @param {String} path
 * @return {String}
 */

function read(path) {
  path = resolve(__dirname, 'fixtures', path);
  return readfile(path, 'utf8');
}

/**
 * Check whether a `path` is a symbolic link.
 *
 * @param {String} path
 * @return {Boolean}
 */

function isSymlink(path) {
  var stat = lstat(path);
  return stat.isSymbolicLink();
}

/**
 * A Duo plugin to compile a Coffeescript `file`.
 *
 * @param {File} file
 */

function cs(file) {
  if (file.type !== 'coffee') return;
  file.type = 'js';
  file.src = coffee.compile(file.src);
}

/**
 * A Duo plugin to compile a Stylus `file`.
 *
 * @param {File} file
 */

function stylus(file) {
  if (file.type !== 'styl') return;
  file.type = 'css';
  file.src = styl(file.src, { whitespace: true }).toString();
}
