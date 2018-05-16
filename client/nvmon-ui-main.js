var serverCards = [];
window.onload = () => {
  // Initialize Server Cards
  for(var i in NvmonConfig.serverList) {
    var server = NvmonConfig.serverList[i];
    serverCards.push(new ServerCard(server.name, server.ip));
  }

  // Initialize Server Card UI
  appendDomAll();
  refreshAll();

  // Periodically Refresh
  setInterval(() => {
    refreshAll();
  }, 1500);
};

function appendDomAll() {
  for(var i in serverCards) {
    var serverCard = serverCards[i];
    serverCard.appendDom();
  }
}

function refreshAll() {
  for(var i in serverCards) {
    var serverCard = serverCards[i];
    serverCard.refresh();
  }
};

function refreshServer(name) {
  for(var i in serverCards) {
    var serverCard = serverCards[i];
    if(serverCard.name == name) {
      serverCard.refresh();
    }
  }
};

/* Server Card */
function ServerCard(name, url, port) {
  this.name = name;
  this.url = url;
  this.port = (port === undefined) ? 3100 : port;
  this.cardId = undefined;
  this.contentsId = undefined;
}

ServerCard.prototype.appendDom = function() {
  this.cardId = "servercard-" + this.name;
  this.contentsId = "servercontents-" + this.name;
  // TODO: Change to table
  var html = '';
  html += ' <div class="col s12 m6 l3" id="'+ this.cardId +'">';
  html += '   <div class="card">';
  html += '     <div class="card-content black-text">';
  html += '       <span class="card-title">' + this.name + ' (' + this.url + ')</span>';
  html += '       <p id="' + this.contentsId + '"></p>';
  html += '     </div>';
  html += '     <div class="card-action"><a href="#" onclick="refreshServer(\'' + this.name + '\')">Refresh</a></div>';
  html += '   </div>';
  html += ' </div>';
  var newDom = $(html);

  $("#mainRow").append(newDom); 
};

ServerCard.prototype.refresh = function() {
  if(this.cardId === undefined || this.contentsId === undefined)
    return;

  var smiAddr = "http://" + this.url + ":" + this.port;

  var httpGetAsync = (theUrl, callback) => {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
      if (xmlHttp.readyState == 4) {
        if(xmlHttp.status == 200)
          callback(xmlHttp.responseText);
        else if(xmlHttp.status == 0 || xmlHttp.status == 404 || xmlHttp.status == 500)
          callback(undefined);
      }
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous 
    xmlHttp.send(null);
  }

  httpGetAsync(smiAddr, (smistr) => {
    if(smistr === undefined) {
      $('#' + this.contentsId).html("Connection failed");
      return;
    }

    var smi = JSON.parse(smistr);
    var gpus;
    if(!Array.isArray(smi.nvidia_smi_log.gpu)) {
      gpus = [];
      gpus.push(smi.nvidia_smi_log.gpu);
    } else {
      gpus = smi.nvidia_smi_log.gpu;
    }

    var str = "";
    for(var i in gpus) {
      var gpu = gpus[i];
      console.log(gpu);
      var gpu_no = gpu.minor_number;
      var name = gpu.product_name;
      var gpu_util = gpu.utilization.gpu_util;
      var mem_util = gpu.utilization.memory_util;
      var used_mem = gpu.fb_memory_usage.used;
      var total_mem = gpu.fb_memory_usage.total;
      
      if(str.length != 0) {
        str = str + "<br />";
      }
      str = str + "<b>GPU " + gpu_no + " (" + name + ")" + "</b>";
      str = str + "<br />&nbsp;&nbsp;&nbsp; GPU Util: " + gpu_util + ", Mem Util: " + mem_util;
      str = str + "<br />&nbsp;&nbsp;&nbsp; Memory: " + used_mem + "/" + total_mem;

      if(typeof gpu.processes == "object"
          && typeof gpu.processes.process_info == "object") {
        var processes;
        if(!Array.isArray(gpu.processes.process_info)) {
          processes = [];
          processes.push(gpu.processes.process_info);
        } else {
          processes = gpu.processes.process_info;
        }

        str = str + "<br />&nbsp;&nbsp;&nbsp; Running: ";
        for(var j in processes) {
          var procinfo = processes[j];
          if(j != 0) {
            str = str + ", ";
          }
          str = str + procinfo.pid + "(" + procinfo.process_name + "; " + procinfo.used_memory + ")";
        }
      } else {
        str = str + "<br />&nbsp;&nbsp;&nbsp; No Running Processes";
      }
    }
    $('#' + this.contentsId).html(str);
  });
};
