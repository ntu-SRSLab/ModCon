#!/bin/bash




examples=(Diceether CryptoPunks MyCryptoHeroes-presale MyCryptoHeroes-game EtherEstates OpenSea Superrare AdEx MakersPlace)
# mv txResult and source code to data directory
cp  gambling/diceether/Diceether/txResult.txt data/Diceether-txResult.txt 
cp  game/CryptoPunks/txResult.txt data/CryptoPunks-txResult.txt 
cp  game/MyCryptoHeroes/presale/txResult.txt data/MyCryptoHeroes-presale-txResult.txt 
cp  game/MyCryptoHeroes/game/txResult.txt data/MyCryptoHeroes-game-txResult.txt 
cp  marketplaces/EtherEstates/txResult.txt data/EtherEstates-txResult.txt 
cp  marketplaces/OpenSea/txResult.txt data/OpenSea-txResult.txt 
cp  marketplaces/Superrare/txResult.txt data/Superrare-txResult.txt 
cp  media/AdEx/txResult.txt data/AdEx-txResult.txt 
cp  media/MakersPlace/txResult.txt data/MakersPlace-txResult.txt 

cp  gambling/diceether/Diceether.sol data/ 
cp  game/CryptoPunks/CryptoPunks.sol data/ 
cp  game/MyCryptoHeroes/presale/HeroesPresale.sol data/MyCryptoHeroes-presale.sol
cp  game/MyCryptoHeroes/game/HeroesGateWay.sol data/MyCryptoHeroes-game.sol 
cp  marketplaces/EtherEstates/EtherEstates.sol data/
cp  marketplaces/OpenSea/OpenSea.sol data/
cp  marketplaces/Superrare/Superrare.sol data/Superrare.sol
cp  media/AdEx/AdEx.sol data/ 
cp  media/MakersPlace/MakersPlace.sol data/


examples=( Diceether CryptoPunks MyCryptoHeroes-presale MyCryptoHeroes-game EtherEstates OpenSea Superrare AdEx MakersPlace EthexBet DecentralGames Degens OceanMarket FunFair  dice2win 0x Uniswap IDEX Curv Compound Axie KnownOriginMarketplace Fyooz SingularityNET CryptoKitties OriginProtocol Rarible district0x  )
for example in ${examples[@]}
do
   echo $example
   if [ -f data/$example.sol ]; then 
        cat data/$example.sol | wc -l
   else 
        echo "$example.sol doesn't exist"
   fi 
done 





