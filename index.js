"use strict";
/*global module, require*/
var _ = require("underscore"),
    camelize = require("camelize"),
    gutil = require("gulp-util"),
    Stream = require("readable-stream"),
    cheerio = require("cheerio"),
    path = require("path");

function svg2object(data){
  var $ = cheerio.load(data);
  var svg = _.pick($("svg").attribs, "viewbox");
  var paths = _.map($("path"), function(p){
    return _.pick(p.attribs, "d", "stroke-linecap");
  });
  return camelize({svg: svg, path: paths});
}

module.exports = function(options) {
  var files = [];
  var stream = new Stream.Transform({objectMode: true});

  options = options || {};
  options.fileName = options.fileName || "out.json";

  options.log   = options.log   || function(){
    gutil.log.apply(gutil, ["gulp-svg2json:"].concat([].slice.call(arguments, 0).concat()));
  };
  options.error = options.error || function(){
    stream.emit("error", new gutil.PluginError("svgicons2svgfont", [].slice.call(arguments, 0).concat()));
  };


  // Collecting icons
  stream._transform = function bufferContents(file, unused, done) {
    // When null just pass through
    // If the ext doesn't match, pass it through
    if(file.isNull() || (!options.ignoreExt) && ".svg" !== path.extname(file.path)) { stream.push(file); done(); return;}
    files.push(file);
    done();
  };

  // Generating the font
  stream._flush = function endStream(done){
    // No icons, exit

    if (files.length === 0) { return done(); }
    // Map each icons to their corresponding icons

    var icons = files.map(function(file) {
      // Creating an object for each icon
      var matches = path.basename(file.path).match(/^(.*).svg$/i);

      var glyph = {
        name: matches[1],
        file: file.path,
        stream: file.pipe(new Stream.PassThrough()),
        json: svg2object(String(file.contents))
      };
      console.log("Adding "+file.path);
      return glyph;
    });

    icons.forEach(function(glyph) { glyph.stream.on("end", function() {}); });

    var joinedJson = _.reduce(icons, function(memo, f){
      memo[f.name]=f.json;
      return memo;
    }, {});

    var joinedFile = new gutil.File({
      cwd: files[0].cwd,
      base: files[0].base,
      path: path.join(files[0].base, options.fileName),
      contents: new Buffer(JSON.stringify(joinedJson, null, 2))
    });
    stream.push(joinedFile);
    done();
  };


  return stream;
};
