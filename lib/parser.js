var http = require('http');
var sax = require('sax');

exports.parse = function(url) {
  var parser = sax.parser(true);
  parser.onerror = function (e) {
    // an error happened.
  };
  parser.ontext = function (t) {
    // got some text.  t is the string of text.
  };
  parser.onopentag = function (node) {
    console.log(node.name);
  };
  parser.onattribute = function (attr) {
    // an attribute.  attr has "name" and "value"
  };
  parser.onend = function () {
    // parser stream is done, and ready to have more stuff written to it.
  };

  parser.write('<xml>Hello, <who name="world">world</who>!</xml>').close();


}