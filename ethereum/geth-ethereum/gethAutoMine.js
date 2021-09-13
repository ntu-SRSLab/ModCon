//gethrun script .
//function : 1、detect whether there exists one transaction has been submitted 
//           2、auto mine to enable the transaction in BlockChain
//console.log(web3.personal.newAccount("123456"));
//console.log(web3.personal.newAccount("123456"));
// console.log(eth.accounts);
// var primary = eth.accounts[0];
// personal.unlockAccount(primary,"",200*60*60);
// personal.unlockAccount(eth.accounts[1],"123456",200*60*60)

// personal.sendTransaction({from: eth.accounts[0], to: eth.accounts[1], value:"0x2000000000000"})
// personal.sendTransaction({from: eth.accounts[0], to: eth.accounts[2], value:"0x2000000000000"})
// personal.sendTransaction({from: eth.accounts[0], to: eth.accounts[3], value:"0x2000000000000"})
// personal.sendTransaction({from: eth.accounts[0], to: eth.accounts[4], value:"0x2000000000000"})
// personal.sendTransaction({from: eth.accounts[0], to: eth.accounts[5], value:"0x2000000000000"})
// miner.setEtherbase(primary);
// while(true){
//    // miner.start(2);
// }
while(true){
   var status = txpool.status;
   if(status.pending!=0||status.queued!=0){
		miner.start(4);
				// admin.sleepBlocks(1);
   }else{
      miner.stop();
   }
}
