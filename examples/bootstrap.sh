#!/bin/bash

node download.js  --contract EthexBet --address 0x8dc74D28B9821f7f9d0e95AB2D3C66f5276AC474 --transactions 424
node download.js  --contract DecentralGames --address 0xEE06A81a695750E71a662B51066F2c74CF4478a0 --transactions 1720
node download.js  --contract PoolTogether --address 0xb7896fce748396EcFC240F5a0d3Cc92ca42D7d84 --transactions 4579
node download.js  --contract Degens --address 0x8888888883585b9a8202Db34D8b09d7252bfc61C --transactions 42284
node download.js  --contract dice2win --address 0xD1CEeeeee83F8bCF3BEDad437202b6154E9F5405 --transactions 61083
node download.js  --contract OceanMarket --address 0x967da4048cd07ab37855c090aaf366e4ce1b9f48 --transactions 98712
node download.js  --contract FunFair --address 0x419D0d8BdD9aF5e606Ae2232ed285Aff190E711b --transactions 431948







# python3 getPermission.py  --input  gambling/diceether/Diceether/txResult.txt --permission --output Diceether 
# python3 getPermission.py  --input  game/CryptoPunks/txResult.txt --permission --output CryptoPunks 
# python3 getPermission.py  --input  game/MyCryptoHeroes/presale/txResult.txt --permission --output MyCryptoHeroes-presale 
# python3 getPermission.py  --input  game/MyCryptoHeroes/game/txResult.txt --permission --output MyCryptoHeroes-game 
# python3 getPermission.py  --input  marketplaces/EtherEstates/txResult.txt --permission --output EtherEstates
# python3 getPermission.py  --input  marketplaces/OpenSea/txResult.txt --permission --output OpenSea
# python3 getPermission.py  --input  marketplaces/Superrare/txResult.txt --permission --output Superrare
# python3 getPermission.py  --input  media/AdEx/txResult.txt --permission --output AdEx
# python3 getPermission.py  --input  media/MakersPlace/txResult.txt --permission --output MakersPlace


# examples=(Diceether CryptoPunks MyCryptoHeroes-presale MyCryptoHeroes-game EtherEstates OpenSea Superrare AdEx MakersPlace)
# for example in ${examples[@]}
# do 
#     python3 RoleMining.py  --input data/$example-userPermissionMatrix.csv --rolemining --output $example
# done 