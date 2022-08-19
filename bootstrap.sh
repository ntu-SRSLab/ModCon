#!/bin/bash
# start back-end (server) of ModCon
workspace=$(pwd)
cd $workspace/server && npm install && node server.js &
sleep 120
# start front-end (client) of ModCon
cd $workspace/app && npm install && npm run serve