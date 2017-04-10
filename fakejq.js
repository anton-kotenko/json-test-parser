var MYJSON = require('./json.js');
var data = Buffer(0);

process.stdin.on('data', function (chunk) {
  data = Buffer.concat([data, chunk]);
});
process.stdin.on('end', function () {
  var obj;
  try {
    obj = MYJSON.parse(data.toString('utf8'));
  } catch (e) {
    console.error("bad input", e);
    process.exit();
  }
  var path = (process.argv[2] || '').replace(/\.+/g, '.').replace(/^\./, '');
  if (path) {
    console.log(path.split('.').reduce(function (value, key) {
      if (value[key] === undefined) {
        console.error("there are no such key" );
        process.exit();
      }
      return value[key];
    }, obj));
  } else {
    console.log(obj);
  }
});
process.stdin.resume();
