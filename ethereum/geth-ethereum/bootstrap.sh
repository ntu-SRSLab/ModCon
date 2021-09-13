#!/bin/bash
geth  --dev --datadir /ethereum/tmp removedb  && geth --dev  --datadir /ethereum/tmp init /ethereum/CustomGenisis.json  
geth --dev  --targetgaslimit '9000000000000'  --syncmode "fast"   --networkid 1900  --rpc -rpcaddr "0.0.0.0"  --rpcport "8545" --rpccorsdomain "*" --port "30303" --nodiscover  --rpcapi "db,eth,net,web3,miner,net,txpool,admin,personal,debug" --datadir /ethereum/tmp --nat "any"  js /ethereum/gethAutoMine.js 

