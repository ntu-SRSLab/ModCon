#!/bin/bash
apt update && apt install -y wget nodejs npm git curl
npm i -g n && n --preserve 15.5.0
npm i -g npm@6.14.4
# start back-end (server) of ModCon
workspace=$(pwd)
cd $workspace/server && npm install && node server.js &
sleep 120
# start front-end (client) of ModCon
cd $workspace/app && npm install && npm run serve