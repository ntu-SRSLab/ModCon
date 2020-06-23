const Web3 = require("web3");
const Provider = new Web3.providers.HttpProvider("http://localhost:8545");
const web3 =  new Web3(Provider); 
console.log(`connect to ethereum?  ${web3.isConnected()? "yes":"no"}`);
console.log(web3.eth.accounts);