var config ={
  port: 3100,
  /* Name filter of interface that will serve nvmon smi server*/
  ifnameFilter: /(enp|eth|eno1)\w*/g,
  /* IP address filter of interface that will serve nvmon smi server*/
  ipFilter: /(192\.168\.\d{1,3}\.\d{1,3})/g
}
module.exports = config;
