var http = require('http');
var sax = require('sax');

var srv = http.createServer(function (req, res) {
  var match = req.url.match(/^\/api\/(.+)\/forecast$/);
  if (match) {
    var place = match[1];
    var url = "http://www.yr.no/place/" + place + "/forecast_hour_by_hour.xml";
    http.get(url, function(cres) {
      if (cres.statusCode == 200) {
        res.writeHead(200, {'Content-type': 'application/json'});

        var parser = new Parser();
        parser.ondata = function(chunk) {
          res.write(chunk);
        };
        parser.onend = function() {
          res.end();
        };

        cres.setEncoding('utf8');
        cres.on('data', function (chunk) {
          parser.write(chunk);
        });
        cres.on('end', function() {
          parser.close();
        });

      } else if (cres.statusCode == 404) {
        res.writeHead(404);
        res.end();
      } else {
        res.writeHead(500);
        res.end();
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

srv.listen(3000);


function Parser() {
  var weather = {};
  var days = [];
  var times = [];
  var time = null;
  var meta = null;
  var location = null;
  var loc2 = false;
  var text = null;
  var date = null;

  this.parser = sax.parser(true);
  this.parser.onerror = function (e) {
    console.log(e);
  };
  this.parser.ontext = function (t) {
    if (meta || location) {
      text += t;
    }
  };
  this.parser.onopentag = function(node) {
    if (node.name === 'time') {
      var from = node.attributes.from.split('T');
      var to = node.attributes.to.split('T');
      time = {
        from: {
          date: from[0],
          time: from[1]
        },
        to: {
          date: to[0],
          time: to[1]
        }
      };
    } else if (time) {
      time[node.name] = node.attributes;
    } else if (node.name === 'meta') {
      meta = {};
    } else if (node.name === 'location') {
      if (location) {
        location.location = node.attributes;
        loc2 = true;
      } else {
        location = {};
      }
    } else if (meta) {
      text = "";
    } else if (location) {
      text = "";
      if (node.name === 'timezone') {
        location[node.name] = node.attributes;
      }
    }
  };
  this.parser.onclosetag = function(name) {
    if (name === 'time') {
      if (date !== time.from.date) {
        times = [];
        days.push({
          date: time.from.date,
          slots: times
        });
        date = time.from.date;
      }
      times.push(time);
      time = null;
    } else if (name === 'meta') {
      weather.meta = meta;
      meta = null;
    } else if (name === 'location') {
      if (loc2) {
        loc2 = false;
      } else {
        weather.location = location;
        location = null;
      }
    } else if (meta) {
      meta[name] = text;
    } else if (location) {
      if (name === 'name' || name === 'type' || name === 'country') {
        location[name] = text;
      } 
    }
  };
  var t = this;
  this.parser.onend = function () {
    weather.forecast = days;
    t.ondata(JSON.stringify(weather));
    t.onend();
  };
}
Parser.prototype.write = function(chunk) {
  this.parser.write(chunk);
};
Parser.prototype.close = function() {
  this.parser.close();
};

