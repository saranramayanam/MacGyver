// Path variables
var finalBuildPath = "lib/";
var componentFile = "bower.json";

var child = require("child_process");

var GIT_TAG = "git describe --tags --abbrev=0";

function getLastVersion(callback) {
  child.exec(GIT_TAG, function(error, stdout, stderr) {
    var data = error != null ? "" : stdout.replace("\n", "");
    callback(error, data);
  });
};

module.exports = function(grunt) {

  /**
   * @name replace
   * @description
   * Replace placeholder with other values and content
   */
  grunt.registerMultiTask("replace", "Replace placeholder with contents", function() {
    var options = this.options({
      separator: "",
      replace: "",
      pattern: null
    });

    var parse = function(code) {
      var templateUrlRegex = options.pattern;
      var updatedCode = code;
      var match;
      while (match = templateUrlRegex.exec(code)) {
        var replacement;
        if (grunt.util._(options.replace).isFunction()) {
          replacement = options.replace(match);
        } else {
          replacement = options.replace;
        }
        updatedCode = updatedCode.replace(match[0], replacement);
      }
      return updatedCode;
    };

    this.files.forEach(function(file) {
      var src = file.src.filter(function(filepath) {
        var exists;
        if (!(exists = grunt.file.exists(filepath))) {
          grunt.log.warn("Source file '" + filepath + "' not found");
        }
        return exists;
      }).map(function(filepath) {
        return parse(grunt.file.read(filepath));
      }).join(grunt.util.normalizelf(options.separator));

      grunt.file.write(file.dest, src);
      grunt.log.writeln("Replace placeholder with contents in '" + file.dest + "' successfully");
    });
  });

  /**
   * @name Marked task
   * @description
   * To convert markdown generated by Chalkboard to html
   */
  grunt.registerMultiTask("marked", "Convert markdown to html", function() {
    var options = this.options({
      separator: grunt.util.linefeed
    });

    this.files.forEach(function(file) {
      var src = file.src.filter(function(filepath) {
        var exists;
        if (!(exists = grunt.file.exists(filepath))) {
          grunt.log.warn("Source file '" + filepath + "' not found");
        }
        return exists;
      }).map(function(filepath) {
        var marked = require("marked");
        return marked(grunt.file.read(filepath));
      }).join(grunt.util.normalizelf(options.separator));

      grunt.file.write(file.dest, src);
      grunt.log.writeln("Converted '" + file.dest + "'");
    });
  });

  /**
   * @name updatebuild
   * @description
   * Update bower.json version of all bower repositories
   */
  grunt.registerMultiTask("updatebuild", "Update all bower.json in build/", function() {
    var version = grunt.config.get("pkg").version;
    var options = this.options({
      separator: grunt.util.linefeed
    });

    this.files.forEach(function(file) {
      var src = file.src.filter(function(filepath) {
        var exists;
        if (!(exists = grunt.file.exists(filepath))) {
          grunt.log.warn("File '" + filepath + "' not found");
        }
        return exists;
      }).map(function(filepath) {
        var data = grunt.file.readJSON(filepath, {
          encoding: "utf8"
        });
        data.version = grunt.config.get("pkg").version;
        return JSON.stringify(data, null, "  ");
      }).join(grunt.util.normalizelf(options.separator));

      grunt.file.write(file.dest, src, {
        encoding: "utf8"
      });
      grunt.log.writeln("Updated version in " + file.dest);
    });
  });

  /**
   * @name tag
   * @description
   * Create a new commit and tag the commit with a version number
   */
  grunt.registerTask("tag", "Tag latest commit", function() {
    var done = this.async();
    var version = grunt.config.get("pkg").version;

    var CMD = [
      "git commit -am 'chore(build): Build v" + version + "'",
      "git tag v" + version
    ].join("&&");

    child.exec(CMD, function(error, stdout, stderr) {
      if (error != null) {
        grunt.fail.fatal("Failed to tag");
      }
      grunt.log.writeln(stdout);
      done();
    });
  });

  /**
   * @name protractor
   * @description
   * To run protractor. Following codes are taken from AngularJS, see:
   * https://github.com/angular/angular.js/blob/master/lib/grunt/utils.js#L155
   */
  grunt.registerMultiTask("protractor", "Run Protractor integration tests", function() {
    var done = this.async();
    
    var args = ["node_modules/protractor/bin/protractor", this.data];

    p = child.spawn("node", args);
    p.stdout.pipe(process.stdout);
    p.stderr.pipe(process.stderr);
    p.on("exit", function(code) {
      if (code !== 0) {
        grunt.fail.warn("Protractor test(s) failed. Exit code: " + code);
      }
      done();
    });
  });
};