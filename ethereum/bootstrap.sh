#!/bin/bash
workdir=$(pwd)
(cd ../go-ethereum && sudo apt-get install golang && make )
if [[ ! -f ../go-ethereum ]]
then 
   echo "$workdir/../go-ethereum/build/bin/geth not exist"
fi
#if [[ -d $workdir/Ethereum ]]
#then 
#	rm -rf $workdir/Ethereum
#fi
geth=$workdir/../go-ethereum/build/bin/geth
$geth --datadir $workdir/Ethereum removedb -y &&geth --datadir $workdir/Ethereum init $workdir/CustomGenisis.json  
$geth  --targetgaslimit '9000000000000' --allow-insecure-unlock --syncmode "fast" --networkid 1900  --rpc -rpcaddr "0.0.0.0"  --rpcport "8566" --rpccorsdomain "*" --port "30333" --nodiscover  --rpcapi "db,eth,net,web3,miner,net,txpool,admin,personal,debug" --datadir $workdir/Ethereum --nat "any" js gethAutoMine.js 

