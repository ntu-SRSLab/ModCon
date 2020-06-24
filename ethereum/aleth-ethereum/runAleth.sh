sudo docker run -v $(pwd):/home/aleth -v $(pwd)/Ethereum:/root/.ethereum -v $(pwd)/web3:/root/.web3 -it ethereum/aleth:1.7.2 --config /home/aleth/config.json   -m on -a   00eed452f13e237af8089e372c588382990a2df0 --no-discovery --pin --unsafe-transactions

