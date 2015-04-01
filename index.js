"use strict";

/*global module, require*/
var _ = require("underscore"),
    through = require("through2"),
    htmlclean = require("htmlclean"),
    parse = require("jsonml-parse"),
    camelize = require("camelize"),
    gutil = require("gulp-util"),
    path = require("path");


var VALID_ATTRIBUTES=["viewBox", "id", "stroke", "strokewidth", "fill", "fillrule", "transform", "d", "strokelinecap", "points"];
// var VALID_ATTRIBUTES=["d"];
module.exports = function(options) {

  var files = [];
  var stream = through.obj(processSvg, flush);
  options = options || {};

  if(!options.fileName){
    console.log("Error");
  }
  function parseJsonml(data){
    if(_.isArray(data)) {
      return _.map(data, function(datum){
        return parseJsonml(datum);
      });
    }

    if ( _.isObject(data) ){
      // Quick n dirty hack to fix htmlparser2's lowercasing of attributes;
      if(data.viewbox){
        data.viewBox = data.viewbox;
        delete data.viewbox;
      }
      var boundPick = _.pick.bind(undefined, data);
      var d = camelize(boundPick.apply(this, VALID_ATTRIBUTES));
      return d;
    }

    return data;
  }

  function processSvg(file, encoding, done){
    // Pass file through if:
    // - file has no contents
    // - file is a directory
    if (file.isNull() || file.isDirectory()) {
      this.push(file);
      return done();
    }
    if(file.isBuffer()){
      var parseStream = parse();
      var content = new Buffer(htmlclean(file.contents.toString()));
      parseStream.write(content);
      parseStream.on("data", function(data){
        var json = _.map(data, function(datum){ return parseJsonml(datum); });
        file.contents = new Buffer(JSON.stringify(json, null, 2));
        var output = new gutil.File({
          cwd: file.cwd,
          base: file.base,
          path: path.join(file.base, path.basename(file.path, ".svg")+".json"),
          contents: file.contents
        });
        files.push(output);
        stream.push(output);
      });
    }
    return done();
  }

  function flush(done){
      // var out = "module.exports={\n";
    var exports =files.map(function(f){
      var basename = path.basename(f.path, ".json");
      return "  \""+basename+"\": require(\"./"+basename+".json\")";
    });
    var out = "module.exports = {\n"+exports.join(",\n")+"\n};";
    var output = new gutil.File({
      cwd: files[0].cwd,
      base: files[0].base,
      path: path.join(files[0].base, options.fileName),
      contents: new Buffer(out)
    });
    stream.push(output);
    done();
  }

  return stream;
};
