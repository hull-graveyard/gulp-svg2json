# gulp-svg2json

> A very simple gulp module that will take a folder of SVG files and turn it into one JSON file. Useful for react users

Very early stage : Parser is SUPER LIMITED (only `svg` and `path` are supported) because today we prefer to cleanup our SVGs than load messy files into the DOM.

## Install

```
$ npm install --save gulp-svg2json
```


## Usage

```js
var gulpSvg = require('gulp-svg2json');

gulp.task("processSvg", function(){
  gulp.src("./src/svg/**")
  .pipe(gulpSvg({fileName: "all_svg.json"}))
  .pipe(gulp.dest('out/'));
});
```

In a react project, this lets you do this:

```jsx
import React from 'react';
import icons from 'all_svg.json';
import _ from 'underscore';

module.exports _.reduce(Icons, function(icons, icon, name){
  icons[name] = React.createClass({
    getDefaultProps() {
      return {size:16, color:'#ff6600'};
    },
    render(){
      var paths = icon.path.map(function(p){
        <path {...p} fill={color}/>
      });
      var size=this.props.size;
      return <svg {...icon.svg} width={`${size}px`} height={`${size}px`}>{paths}</svg>;
    }
  });
  return icons;
},{});
```


## API

### gulpSvg([options])

#### options

##### fileName

Type: `string`  
Default: `out.json`

## License

MIT © [Romain Dardour](http://hull.io)
