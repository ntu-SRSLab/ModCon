#!/bin/bash 
echo $(pwd)
if ! command -v geth &> /dev/null
then
        echo "geth could not be found"
	echo "install geth"

	wget 	https://gethstore.blob.core.windows.net/builds/geth-linux-386-1.8.23-c9427004.tar.gz
        tar -zxvf geth-linux-386-1.8.23-c9427004.tar.gz 
        sudo cp geth-linux-386-1.8.23-c9427004/geth /usr/bin
        echo $(geth --version) "has been installed" 
fi
geth --nousb --datadir "$(pwd)/Ethereum" removedb&&geth --datadir "$(pwd)/Ethereum"  init "$(pwd)/CustomGenisis.json"
geth --nousb --targetgaslimit '9000000000000'  --syncmode "fast" --networkid 1900  --rpc -rpcaddr "0.0.0.0"  --rpcport "8645" --rpccorsdomain "*" --port "30603" --nodiscover  --rpcapi "eth,net,web3,miner,net,txpool,admin,personal,debug" --datadir $(pwd)/Ethereum --nat "any"  --unlock 0 --password pwd.txt js $(pwd)/gethAutoMine.js 

