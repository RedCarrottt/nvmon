var path = require('path');
var connect = require('connect');
var serveStatic = require('serve-static');

console.log(process.argv);
var portNum = undefined;
if(process.argv.length > 2) {
  portNum = process.argv[2];
} else {
  portNum = 8080;
}
var clientPath = path.join(__dirname, './client');
console.log(clientPath);

var server = connect();
server.use(serveStatic(clientPath)).listen(portNum, function() {
  console.log("Web Server Started! (Port " + portNum + ")");
});
