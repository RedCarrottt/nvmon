window.onload = () => {
  httpGetAsync("http://115.145.178.78:3100", (smistr) => {
    var smi = JSON.parse(smistr);
    var gpus = smi.nvidia_smi_log.gpu;

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
      str = str + gpu_no + " (" + name + ") -- GPU Util: " + gpu_util + ", Mem Util: " + mem_util + ", Memory: " + used_mem + "/" + total_mem;

      if(typeof gpu.processes == "object"
          && typeof gpu.processes.process_info == "object") {
        var procinfo = gpu.processes.process_info;
        str = str + "<br />&nbsp;&nbsp;&nbsp; Running: " + procinfo.pid + "(" + procinfo.process_name + "; " + procinfo.used_memory + ")";
      } else {
        str = str + "<br />&nbsp;&nbsp;&nbsp; No Running Processes";
      }
    }
    $("#smiContents").html(str);
  });
};

function httpGetAsync(theUrl, callback) {
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.onreadystatechange = function() { 
    if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
      callback(xmlHttp.responseText);
  }
  xmlHttp.open("GET", theUrl, true); // true for asynchronous 
  xmlHttp.send(null);
}

function addServerCard() {
  
}
