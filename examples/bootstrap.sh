#!/bin/bash


node download.js  --contract EthexBet --address 0x8dc74D28B9821f7f9d0e95AB2D3C66f5276AC474 --transactions 424
node download.js  --contract DecentralGames --address 0xEE06A81a695750E71a662B51066F2c74CF4478a0 --transactions 1720
node download.js  --contract PoolTogether --address 0xb7896fce748396EcFC240F5a0d3Cc92ca42D7d84 --transactions 4579
node download.js  --contract Degens --address 0x8888888883585b9a8202Db34D8b09d7252bfc61C --transactions 42284
node download.js  --contract dice2win --address 0xD1CEeeeee83F8bCF3BEDad437202b6154E9F5405 --transactions 61083
node download.js  --contract OceanMarket --address 0x967da4048cd07ab37855c090aaf366e4ce1b9f48 --transactions 98712
node download.js  --contract FunFair --address 0x419D0d8BdD9aF5e606Ae2232ed285Aff190E711b --transactions 431948




node download.js  --contract EthexBet --address 0x0e26B2Dc8EF577bAF50891Eac94f0DEf59B5Da16 --transactions 5821
node download.js  --contract DecentralGames --address 0xEE06A81a695750E71a662B51066F2c74CF4478a0 --transactions 1720
node download.js  --contract PoolTogether --address 0xb7896fce748396EcFC240F5a0d3Cc92ca42D7d84 --transactions 4579
node download.js  --contract Degens --address 0x8888888883585b9a8202Db34D8b09d7252bfc61C --transactions 42284
node download.js  --contract OceanMarket --address 0x967da4048cd07ab37855c090aaf366e4ce1b9f48 --transactions 98712
node download.js  --contract FunFair --address 0x419D0d8BdD9aF5e606Ae2232ed285Aff190E711b --transactions 431948
node download.js  --contract dice2win --address 0xD1CEeeeee83F8bCF3BEDad437202b6154E9F5405 --transactions 41083

node download.js  --contract 0x --address 0x12459C951127e0c374FF9105DdA097662A027093 --transactions 94026
node download.js  --contract Uniswap --address 0x2C4Bd064b998838076fa341A83d007FC2FA50957 --transactions 61674
node download.js  --contract IDEX --address 0x2a0c0DBEcC7E4D658f48E01e3fA353F44050c208 --transactions 80660
node download.js  --contract Curv --address 0xD533a949740bb3306d119CC777fa900bA034cd52 --transactions 32119
node download.js  --contract Compound --address 0xc00e94Cb662C3520282E6f5717214004A7f26888 --transactions 41743

node download.js  --contract Axie --address 0xF5b0A3eFB8e8E4c201e2A935F110eAaF3FFEcb8d --transactions 14535
node download.js  --contract KnownOriginMarketplace --address 0xFBeef911Dc5821886e1dda71586d90eD28174B7d --transactions 16757
node download.js  --contract Fyooz --address 0x6BFf2fE249601ed0Db3a87424a2E923118BB0312 --transactions 7066
node download.js  --contract SingularityNET --address 0x8eB24319393716668D768dCEC29356ae9CfFe285 --transactions 48197
node download.js  --contract CryptoKitties --address 0x06012c8cf97BEaD5deAe237070F9587f8E7A266d --transactions 16880
node download.js  --contract OriginProtocol --address 0x819Bb9964B6eBF52361F1ae42CF4831B921510f9 --transactions 10635
node download.js  --contract Rarible --address 0xFca59Cd816aB1eaD66534D82bc21E7515cE441CF --transactions 46210
node download.js  --contract district0x --address 0x0AbdAce70D3790235af448C88547603b945604ea --transactions 99969


# examples=(Diceether CryptoPunks MyCryptoHeroes-presale MyCryptoHeroes-game EtherEstates OpenSea Superrare AdEx MakersPlace)
# for example in ${examples[@]}
# do 
#     python3 RoleMining.py  --input data/$example-userPermissionMatrix.csv --rolemining --output $example
# done 

# examples=( EthexBet DecentralGames Degens OceanMarket ) 
# for example in ${examples[@]}
# do
#     node filterGeneralTxResult.js --contract $example --tx > ./data/$example-txResult.txt 
#     python3 getPermission.py  --input   ./data/$example-txResult.txt  --permission --output $example
#     python3 RoleMining.py  --input ./data/$example-userPermissionMatrix.csv --rolemining --output $example
# done 

# examples=( FunFair ) 
# for example in ${examples[@]}
# do
#     node filterGeneralTxResult.js --contract $example --tx > ./data/$example-txResult.txt 
#     python3 getPermission.py  --input   ./data/$example-txResult.txt  --permission --output $example
#     timeout 600s python3 RoleMining.py  --input ./data/$example-userPermissionMatrix.csv --rolemining --output $example
# done 

examples=( dice2win 0x Uniswap IDEX Curv Compound Axie KnownOriginMarketplace Fyooz SingularityNET CryptoKitties OriginProtocol Rarible district0x ) 
for example in ${examples[@]}
do
    node filterGeneralTxResult.js --contract $example --tx > ./data/$example-txResult.txt 
    python3 getPermission.py  --input   ./data/$example-txResult.txt  --permission --output $example
    timeout 600s python3 RoleMining.py  --input ./data/$example-userPermissionMatrix.csv --rolemining --output $example
done 



# examples=( EtherxBet DecentralGames dice2win PoolTogether Degens OceanMarket FunFair ) 
# for example in ${examples[@]}
# do
#     node filterGeneralTxResult.js --contract $example --tx > ./data/$example-txResult.txt 
# done 

