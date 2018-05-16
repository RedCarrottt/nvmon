var path = require('path');
var connect = require('connect');
var serveStatic = require('serve-static');
//var cors = require('cors');

console.log(process.argv);
var portNum = undefined;
if(process.argv.length > 2) {
  portNum = process.argv[2];
} else {
  portNum = 8080;
}
var clientPath = path.join(__dirname, './client');
console.log(clientPath);

//var whitelist = ['http://115.145.178.78:3100']
//var corsOptions = {
//  origin: function(origin, callback) {
//    var isWhitelisted = whitelist.indexOf(origin) !== -1;
//    callback(null, isWhitelisted); 
//    // callback expects two parameters: error and options 
//  },
//  credentials:true
//}

var server = connect();
//server.use(cors(corsOptions));
server.use(serveStatic(clientPath)).listen(portNum, function() {
  console.log("Web Server Started! (Port " + portNum + ")");
});
