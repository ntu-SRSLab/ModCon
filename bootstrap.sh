#!/bin/bash
# start back-end (server) of ModCon
cd /home/modcon/server && npm install && node server.js &
sleep 120
# start front-end (client) of ModCon
cd /home/modcon/app && npm install && npm run serve