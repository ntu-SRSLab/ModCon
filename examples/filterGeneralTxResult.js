const { assert } = require("console");
const fs = require("fs");
const web3 = require("web3-eth-abi");
// const web3util = require("web3-utils");
// const request = require('request');
// const sleep = require('sleep');
// const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require("constants");
const { exit } = require("process");
String.prototype.format = function() {
    a = this;
    for (k in arguments) {
      a = a.replace("{" + k + "}", arguments[k])
    }
    return a
  }

var HashMethodMap = new Map();
function loadABI(){
    let count = 0;
    let ABIs = JSON.parse(fs.readFileSync("./data/"+option.contract+"-abi.json"));
    for (let abi of ABIs){
        if((false == abi.constant|| "view"!=abi.stateMutability) && abi.type == "function"){
            let hash = web3.encodeFunctionSignature(abi);
            if(option.all || option.printABI)
                console.log(abi.name, hash);
            HashMethodMap[hash] = abi;
            count ++;
        }
    }
    if(option.all||option.printABI)
        console.log("totally ", count, " non-constant public functions");
}

async function filter(){
    let json ={result: JSON.parse(fs.readFileSync("./data/"+option.contract+"-tx.json"))};
    if(option.all || option.printTx)
        console.log(json.result.length, " transactions");
  
    let Users = new Set();
    let creator = json.result[0].from;
    Users.add(creator);
    let UserIdMap = new Map();
    let id = 0;
    UserIdMap[creator] = id;
    id++;
    // assert(UserIdMap[creator] == 0, UserIdMap[creator] +" "+ creator);
    let Methods = new Map();
    let MethodCount = 0;
    if (option.printTxHash){
        console.log(json.result[0].hash)
    }
    for(let tx of json.result.slice(1)){
        if (option.printTxHash){
            console.log(tx.hash)
        }
        // console.log(tx.input, tx.input.substring(0,11));
        Users.add(tx.from);
        if (undefined == UserIdMap[tx.from]){
            // assert(tx.from != creator);
            UserIdMap[tx.from] = id;
            id ++;
        }
        if(tx.input == ""||tx.input == "0x"){
            if(option.all || option.printTx)
                console.log(tx.from==creator?"creator":"user"+UserIdMap[tx.from], "fallback",  (tx.isError=="0" && tx.txreceipt_status!="0")?"success":"fail");
            if(option.all || option.printBlockNumber){
                console.log(tx.from==creator?"creator":"user"+UserIdMap[tx.from], "fallback", tx.blockNumber);
            }
        }
        else if (HashMethodMap[tx.input.substring(0,10)]){
            if (!Methods[HashMethodMap[tx.input.substring(0,10)].name]){
                Methods[HashMethodMap[tx.input.substring(0,10)].name]=1;
                MethodCount ++;
            }
            else 
                Methods[HashMethodMap[tx.input.substring(0,10)].name]+=1;
            if(option.all || option.printTx){
                console.log(tx.from==creator?"creator":"user"+UserIdMap[tx.from], 
                HashMethodMap[tx.input.substring(0,10)].name
                , 
                (tx.isError=="0" && tx.txreceipt_status!="0")?"success":"fail");
            }


            if(option.all || option.printBlockNumber){
                    console.log(tx.from==creator?"creator":"user"+UserIdMap[tx.from], HashMethodMap[tx.input.substring(0,10)].name, tx.blockNumber);
            }
        }else {
            if(option.all || option.printTx)
                console.log(tx.from==creator?"creator":"user"+UserIdMap[tx.from],"fallback", (tx.isError=="0" && tx.txreceipt_status!="0")?"success":"fail");
         
            if(option.all || option.printBlockNumber){
                console.log(tx.from==creator?"creator":"user"+UserIdMap[tx.from], "fallback", tx.blockNumber);
        }
        }
    }
    if(option.printUser){
        console.log("user\taddress");
        for (let address of Object.keys(UserIdMap)){
            console.log("user{0}\t{1}".format(UserIdMap[address], address));
        }
    }
    if(option.all || option.printStatistics){
        console.log("totally ",Users.size, " users");
        console.log("totally ", MethodCount, " different functions are invoked");
        console.log("functions: ", Methods);
    }
}
var option = {};
async function main(){
    let args = process.argv.slice(2);
    let optionHelp = `\n--help  usage instruction
                      \n--contract contract name
                      \n--all  print all information
                      \n--tx  print only transactions information
                      \n--user  print users address mapping
                      \n--statistics  print only statistics
                      \n--bn  print blocknumber
                      \n--abi  print contract ABI
                      \n--txHash print only transaction hashes
                    `;
    if (args.length==0){
        option.all = true;
    }

    for(let i=0; i<args.length; i++){
        switch(args[i]){
          case  "--help": {
              console.log(optionHelp);
              exit(0);
          }
          case "--all":{
            option.all = true;
            break;
          }
          case "--contract":{
            option.contract = args[i+1];
            i++;
            break;
          }
          case "--tx":{
            option.printTx = true;
            break;
          }
          case "--user":{
            option.printUser = true;
            break;
          }
          case "--statistics":{
            option.printStatistics = true;
            break;
          }
          case "--abi":{
            option.printABI = true;
            break;
          }   
          case "--bn":{
            option.printBlockNumber = true;
            break;
          } 
          case "--txHash":{
            option.printTxHash = true;
            break;
          } 
          default:{
            console.log(optionHelp);
            exit(0);
          }        
        }
    }
    
    loadABI();
    await filter();
}

main();
