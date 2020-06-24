const Web3 = require("web3");
const Provider = new Web3.providers.HttpProvider("http://localhost:8645");
const web3 =  new Web3(Provider); 

async function test(){

//web3.personal.newAccount("123456");

//console.log(web3);
//console.log(`connect to ethereum?  ${web3.isConnected()? "yes":"no"}`);
let accounts = await web3.eth.getAccounts();

let block = await web3.eth.getBlock("latest");
console.log(block);
for (let account of accounts){
	console.log(account, ": ", await web3.eth.getBalance(account));
}
let tx = await web3.eth.getTransaction("0xdc453f856ecebb730c277a26701545e4d8a6030f94965db5895f9d361d486d3f");
let oldAmt = await web3.eth.getBalance(accounts[2]);
console.log(accounts[2], ": ", await  web3.eth.getBalance(accounts[2]));
web3.eth.sendTransaction({
	from: accounts[2], 
	to: accounts[1], 
	value: "0x3", 
	gas:block.gasLimit-2}).then(receipt =>{
	   console.log("receipt: ",receipt);
           console.log(accounts[2], ": ", web3.eth.getBalance(accounts[2]).then(bal =>{
			   console.log("ammount change:", oldAmt - bal);
			   console.log(oldAmt, bal);
           }));
           console.log(accounts[1], ": ", web3.eth.getBalance(accounts[1]).then(console.log));
   	   for (let account of accounts){
		web3.eth.getBalance(account).then(balance=>{
		console.log(account, ":", balance);
	   });
	}
});
}

test();
