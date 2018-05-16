#!/bin/bash

# Check permission
if ! [ $(id -u) = 0 ]; then
  echo "This script should run with root permission."
  exit 1
fi

mkdir -p /usr/bin/nvmon
cp ./nvmon-smi-server.js /usr/bin/nvmon
cp ./nvmon-smi-server.conf /usr/bin/nvmon
cp ./package.json /usr/bin/nvmon
cd /usr/bin/nvmon
npm install
cd -

#start /usr/bin/nvmon/nvmon-smi-server.js
