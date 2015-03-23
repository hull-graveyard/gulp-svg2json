'use strict';
var assert = require('assert');
var gulpParseSvg = require('./');

it('should ', function () {
	assert.strictEqual(gulpParseSvg('unicorns'), 'unicorns & rainbows');
});
