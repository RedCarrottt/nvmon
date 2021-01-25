/* Copyright (c) 2018-2021 Gyeonghwan Hong. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var serverCards = [];
window.onload = () => {
  // Initialize Server Cards
  for (var i in NvmonConfig.serverList) {
    var server = NvmonConfig.serverList[i];
    serverCards.push(new ServerCard(server.name, server.ip, server.port));
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
  for (var i in serverCards) {
    var serverCard = serverCards[i];
    serverCard.appendDom();
  }
}

function refreshAll() {
  for (var i in serverCards) {
    var serverCard = serverCards[i];
    serverCard.refresh();
  }
};

function refreshServer(name) {
  for (var i in serverCards) {
    var serverCard = serverCards[i];
    if (serverCard.name == name) {
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
  this.cardId = 'servercard-' + this.name;
  this.contentsId = 'servercontents-' + this.name;
  // TODO: Change to table
  var html = '';
  html += ' <div class="col s12 m6 l3" id="' + this.cardId + '">';
  html += '   <div class="card">';
  html += '     <div class="card-content black-text">';
  html += '       <span class="card-title">' + this.name + ' (' + this.url +
      ')</span>';
  html += '       <p id="' + this.contentsId + '"></p>';
  html += '     </div>';
  html +=
      '     <div class="card-action"><a href="#" onclick="refreshServer(\'' +
      this.name + '\')">Refresh</a></div>';
  html += '   </div>';
  html += ' </div>';
  var newDom = $(html);

  $('#mainRow').append(newDom);
};

function getTempColor(temp) {
  var hotness = undefined;
  if (temp >= 100)
    hotness = 255;
  else if (temp >= 60)
    hotness = (temp - 60) / 40 * 255;
  else
    hotness = 0;
  var coldness = undefined;
  if (temp < 30)
    coldness = 255;
  else if (temp < 60)
    coldness = -(60 - temp) / 30 * 255;
  else
    coldness = 0;
  var red_num = parseInt(hotness);
  var red = Number(red_num).toString(16);
  var blue_num = parseInt(coldness);
  var blue = Number(blue_num).toString(16);
  var color_value = '#' + red + '00' + blue;
  return color_value;
}

var pname_blacklist = ['Xorg', 'gnome-shell', 'gnome'];
function isBlacklisted(pname) {
  for (var i in pname_blacklist) {
    var entry = pname_blacklist[i];
    if (pname.indexOf(entry) > 0) return true;
  }
  return false;
}

ServerCard.prototype.refresh = function() {
  if (this.cardId === undefined || this.contentsId === undefined) return;

  var smiAddr = 'http://' + this.url + ':' + this.port;

  var httpGetAsync =
      (theUrl, callback) => {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function() {
          if (xmlHttp.readyState == 4) {
            if (xmlHttp.status == 200)
              callback(xmlHttp.responseText);
            else if (
                xmlHttp.status == 0 || xmlHttp.status == 404 ||
                xmlHttp.status == 500)
              callback(undefined);
          }
        } xmlHttp.open('GET', theUrl, true);  // true for asynchronous
        xmlHttp.send(null);
      }

  httpGetAsync(smiAddr, (smistr) => {
    if (smistr === undefined) {
      $('#' + this.contentsId).html('Connection failed');
      return;
    }

    var smi = JSON.parse(smistr);
    var gpus;
    if (smi.error !== undefined) {
      var str = 'nvidia-smi failure';
      $('#' + this.contentsId).html(str);
      console.error('Error on ' + this.name + ' : ' + smi.error);
    }
    if (!Array.isArray(smi.nvidia_smi_log.gpu)) {
      gpus = [];
      gpus.push(smi.nvidia_smi_log.gpu);
    } else {
      gpus = smi.nvidia_smi_log.gpu;
    }

    var str = '';
    for (var i in gpus) {
      var gpu = gpus[i];
      var gpu_no = gpu.minor_number;
      var name = gpu.product_name;
      var gpu_util = gpu.utilization.gpu_util;
      var mem_util = gpu.utilization.memory_util;
      var used_mem = gpu.fb_memory_usage.used;
      var total_mem = gpu.fb_memory_usage.total;
      var temp = gpu.temperature.gpu_temp;
      var temp_slow = gpu.temperature.gpu_temp_slow_threshold;
      var temp_max = gpu.temperature.gpu_temp_max_threshold;
      var temp_num = parseInt(temp)

      if (str.length != 0) {
        str = str + '<br />';
      }
      str = str + '<b>GPU ' + gpu_no + ' (' + name + ')' +
          '</b>';
      str = str + '<br />&nbsp;&nbsp;&nbsp; <font color=\'' +
          getTempColor(temp_num) + '\'>GPU Temp: ' + temp;
      str = str + '</font>'
      str = str + ' (Slow: ' + temp_slow + ' / Max: ' + temp_max + ')';
      str = str + '<br />&nbsp;&nbsp;&nbsp; GPU Util: ' + gpu_util +
          ', Mem Util: ' + mem_util;
      str = str + '<br />&nbsp;&nbsp;&nbsp; Memory: ' + used_mem + '/' +
          total_mem;

      if (typeof gpu.processes == 'object' &&
          typeof gpu.processes.process_info == 'object') {
        var processes;
        if (!Array.isArray(gpu.processes.process_info)) {
          processes = [];
          processes.push(gpu.processes.process_info);
        } else {
          processes = gpu.processes.process_info;
        }

        for (var j in processes) {
          var procinfo = processes[j];
          var username =
              (procinfo.username === undefined) ? 'Unknown' : procinfo.username;
          var pname = procinfo.process_name;
          if (isBlacklisted(pname)) continue;
          var pid = procinfo.pid;
          var used_memory = procinfo.used_memory;
          str = str + '<br />&nbsp;&nbsp;&nbsp; ';
          if (pname.indexOf('xorg') < 0 && pname.indexOf('Xorg') < 0 &&
              pname.indexOf('gnome') < 0) {
            str = str + '<font color=\'red\'><b>';
          }
          str = str + username + ': ' + pname + '(pid ' + pid + ', ' +
              used_memory + ')';
          if (pname.indexOf('xorg') < 0 && pname.indexOf('Xorg') < 0 &&
              pname.indexOf('gnome') < 0) {
            str = str + '</b></font>';
          }
        }
      }
    }
    $('#' + this.contentsId).html(str);
  });
};
