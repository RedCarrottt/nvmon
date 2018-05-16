'use strict';

const smi = require('node-nvidia-smi');
const http = require('http');
var hostname = undefined;
const port = 3100; /* nvmon-smi-server port */

// Get My IP Address
{
  var os = require('os');
  var ifaces = os.networkInterfaces();
  Object.keys(ifaces).forEach(function (ifname) {
    ifaces[ifname].forEach(function (iface) {
      if ('IPv4' !== iface.family || iface.internal !== false) {
        // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
        return;
      }

      if(ifname.startsWith("enp") || ifname.startsWith("eth")) {
        hostname = iface.address;
      }
    });
  });
}
if(hostname === undefined) {
  console.log("[Error] Cannot get my IP address");
  return;
}

// Set Server
const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Access-Control-Allow-Origin', '*');

  var smiCallback = (err, data) => {
    if(err) {
      console.warn(err);
      process.exit(1);
    }

    res.end(JSON.stringify(data, null, ' '));
  }
  smi(smiCallback);
});

// Start Server
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
