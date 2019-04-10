'use strict';

const smi = require('node-nvidia-smi');
const http = require('http');
const child_process = require('child_process');
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

      if(os.type().startsWith("Windows") ||
          ifname.startsWith("enp") ||
          ifname.startsWith("eth") ||
          ifname.startsWith("wlan")) {
        hostname = iface.address;
      }
    });
  });
}
if(hostname === undefined) {
  console.log("[Error] Cannot get my IP address");
  return;
}

function add_username(smiObj) {
  var gpus;
  if(!Array.isArray(smiObj.nvidia_smi_log.gpu)) {
    gpus = [];
    gpus.push(smiObj.nvidia_smi_log.gpu);
  } else {
    gpus = smiObj.nvidia_smi_log.gpu;
  }

  var pidListRaw = child_process.execSync("ps -eo pid,user").toString();
  var pidListRawLines = pidListRaw.split("\n");
  var pidToUsername = [];
  for(i in pidListRawLines) {
    var line = pidListRawLines[i];
    var toks = line.replace(/\s+/g, " ").split(" ");
    var pid, username;
    if(toks[0] == "") {
      pid = parseInt(toks[1]);
      username = toks[2];
    } else {
      pid = parseInt(toks[0]);
      username = toks[1];
    }
    if(isNaN(pid)) continue;
    pidToUsername[pid] = username;
  }

  for(var i in gpus) {
    var gpu = gpus[i];
    var gpu_no = gpu.minor_number;
    var name = gpu.product_name;
    var gpu_util = gpu.utilization.gpu_util;
    var mem_util = gpu.utilization.memory_util;
    var used_mem = gpu.fb_memory_usage.used;
    var total_mem = gpu.fb_memory_usage.total;

    if(typeof gpu.processes == "object"
      && typeof gpu.processes.process_info == "object") {
      if(Array.isArray(gpu.processes.process_info)) {
        for(var j in gpu.processes.process_info) {
          var pid = gpu.processes.process_info[j].pid;
          var username = pidToUsername[pid];
          if(username === undefined) {
            username = "Unknown";
          }
          gpu.processes.process_info[j].username = username;
        }
      } else if(typeof gpu.processes.process_info === "object") {
          var pid = gpu.processes.process_info.pid;
          var username = pidToUsername[pid];
          if(username === undefined) {
            username = "Unknown";
          }
          gpu.processes.process_info.username = username;
      }
    }
  }
  return smiObj;
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
    data = add_username(data);
    res.end(JSON.stringify(data, null, ' '));
  }
  smi(smiCallback);
});

// Start Server
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
