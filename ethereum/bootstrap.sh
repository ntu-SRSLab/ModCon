#!/bin/bash
geth --datadir /ethereum/Ethereum removedb  && geth --datadir /ethereum/Ethereum init /ethereum/CustomGenisis.json  
geth  --targetgaslimit '9000000000000'  --syncmode "fast" --networkid 1900  --rpc -rpcaddr "0.0.0.0"  --rpcport "8545" --rpccorsdomain "*" --port "30303" --nodiscover  --rpcapi "db,eth,net,web3,miner,net,txpool,admin,personal,debug" --datadir /ethereum/Ethereum --nat "any" js /ethereum/gethAutoMine.js 

