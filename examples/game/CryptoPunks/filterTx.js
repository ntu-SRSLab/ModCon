const { assert } = require("console");
const fs = require("fs");
const web3 = require("web3-eth-abi");
const request = require('request');
const sleep = require('sleep');
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require("constants");
const { exit } = require("process");
var HashMethodMap = new Map();

String.prototype.format = function() {
    a = this;
    for (k in arguments) {
      a = a.replace("{" + k + "}", arguments[k])
    }
    return a
  }
var api_key = "URF6R5PGNZ7CT6TTBU7M8NH5V8WRISHIZZ";

var url_source = " https://api.etherscan.io/api?module=contract&action=getsourcecode&address={0}&apikey={1}"
var url_txs = "https://api.etherscan.io/api?module=account&action=txlist&address=0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB&startblock={0}&endblock=99999999&sort=asc&apikey={1}";
function GET(url) {
    console.log(url);
    return new Promise((resolve, reject) => {
        request(url, (error, response, body) => {
            if (error) reject(error);
            if (response.statusCode != 200) {
                reject('Invalid status code <' + response.statusCode + '>');
            }
            resolve(body);
            sleep.sleep(5)
        });
    });
}
var url_events = "https://api.etherscan.io/api?module=logs&action=getLogs&fromBlock={0}&toBlock={1}&address=0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB&topic0={2}&apikey={3}";

var logs = undefined;
async function getLogByTransactionHash(transactionHash){
    if (logs == undefined){
        logs = JSON.parse(fs.readFileSync("./logs.json"));
    }
    // console.log(logs);
    let retLogs = logs.filter(log =>{
        return log.transactionHash == transactionHash;
    })
    assert(retLogs.length >= 1, "logs nonexist"+JSON.stringify(retLogs));
    let args = web3.decodeLog(createDigitalEvent.inputs, retLogs[0].data);
    // console.log(args);
    return args.id;
}
async function getLogs(start, end){
    let body = await GET(url_events.format(start, end, createDigitalTopic, api_key));
    // console.log(body);
    /**
     * parse event logs
     */
    let json = JSON.parse(body);
    return json.result;
}

async function getSource(address, name){
    if (fs.existsSync(name+".sol") && fs.existsSync(name+".abi")){
        return;
    }
    let body = await GET(url_source.format(address, api_key));
    /**
     * parse source 
     * [{"source": ..., "ABI":... }]
     */
    let json = JSON.parse(body);
    assert(json.result.length==1, "result is empty");
    for (let pair of json.result){
        fs.writeFileSync(name+".sol",pair.SourceCode);
        fs.writeFileSync(name+".abi",pair.ABI);
    }
    return;
}



function getMaxBlockNumber(tx_file){
    let tx_json = JSON.parse(fs.readFileSync(tx_file));
    if (tx_json.result!=undefined)
        tx_json = tx_json.result;
    return parseInt(tx_json[tx_json.length-1].blockNumber);
}

async function getAllLogs(){  
    // check whether all event logs has been downloaded.
    // if downloaded, skip and return;
    // otherwise, download it from etherscan.
    if(fs.existsSync("./logs.json")){
        return;
    }
    let createDigitalLogs = [];
    let maxBN = getMaxBlockNumber("./tx.json");
    for(let bn=0; bn<maxBN; ){
        console.log(bn, maxBN);
        createDigitalLogs = createDigitalLogs.concat(await getLogs(bn, maxBN));
        let newbn = parseInt(createDigitalLogs[createDigitalLogs.length-1].blockNumber);
        if (newbn == bn)
            break;
        else 
            bn = newbn;
    }
    fs.writeFileSync("./logs.json", JSON.stringify(createDigitalLogs));
}
async function getTransactions(transactions_number){
    // check whether all transactions has been downloaded.
    // if downloaded, skip and return;
    // otherwise, download it from etherscan.
    if(fs.existsSync("./tx.json")){
        return;
    }
    let result = [];
    let start = 0;
    for (let i=0; i<Math.floor(transactions_number/10000)+1; i++){
        let body = await GET(url_txs.format(start,api_key));
        console.log(JSON.parse(body).result.length+" txs");
        result = result.concat(JSON.parse(body).result);
        start = parseInt(result[result.length-1].blockNumber)+1;
    }
    fs.writeFileSync("./tx.json",JSON.stringify(result));
    return;
}

let createDigitalTopic;
let createDigitalEvent;

function loadABI(name){
    let count = 0;
    let ABIs = JSON.parse(fs.readFileSync(name+".abi"));
    for (let abi of ABIs){
        if((false == abi.constant|| "view"!=abi.stateMutability) && abi.type == "function"){
        // if(abi.type == "function"){
            // console.log(abi);
            let hash = web3.encodeFunctionSignature(abi);
            if(option.all || option.printABI)
                console.log(abi.name, hash);
            HashMethodMap[hash] = abi;
            count ++;
        }else if (abi.type == "event" && abi.name == "DigitalMediaCreateEvent")
        {
            createDigitalEvent = abi;
            createDigitalTopic = web3.encodeEventSignature(createDigitalEvent);
        }
    }
    
    
    if(option.all||option.printABI)
        console.log("totally ", count, " non-constant public functions");
}

async function filter(){
    let json ={result: JSON.parse(fs.readFileSync("./tx.json"))};
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
    let gameIdCntr = 1;
    let Methods = new Map();
    let MethodCount = 0;
    if (option.printTxHash){
        console.log(json.result[0].hash)
    }
    for(let tx of json.result.slice(1)){
        if (option.printTxHash){
            console.log(tx.hash)
        }
        Users.add(tx.from);
        if (undefined == UserIdMap[tx.from]){
            // assert(tx.from != creator);
            UserIdMap[tx.from] = id;
            id ++;
        }
        if(tx.input == ""||tx.input == "0x"){
            if(option.all || option.printTx)
                console.log(tx.hash, tx.from==creator?"creator":"user"+UserIdMap[tx.from], "fallback", (tx.isError=="0" && tx.txreceipt_status!="0") ?"success":"fail");
            if(option.all || option.printBlockNumber){
                console.log(tx.hash, tx.from==creator?"creator":"user"+UserIdMap[tx.from], "fallback", tx.blockNumber);
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
                let input = web3.decodeParameters(HashMethodMap[tx.input.substring(0,10)].inputs, "0x"+tx.input.slice(10));
                if (HashMethodMap[tx.input.substring(0,10)].name == "setInitialOwners"){
                     let n = input.addresses.length;
                     let punkIndices = input.indices;  
                     for(let i=0; i<n; i++){
                        console.log(tx.hash, tx.from==creator?"creator":"user"+UserIdMap[tx.from], 
                        "setInitialOwner" + " "
                        +
                        punkIndices[i]
                        , 
                        (tx.isError=="0" && tx.txreceipt_status!="0") ?"success":"fail");
                     } 
                }else{
                    console.log(tx.hash, tx.from==creator?"creator":"user"+UserIdMap[tx.from], 
                    HashMethodMap[tx.input.substring(0,10)].name + " "
                    +
                    (input!=undefined? (input.punkIndex != undefined? input.punkIndex:""):"")
                    , 
                    (tx.isError=="0" && tx.txreceipt_status!="0") ?"success":"fail");
                }
            }
            if(option.all || option.printBlockNumber){
                    console.log(tx.hash, tx.from==creator?"creator":"user"+UserIdMap[tx.from], HashMethodMap[tx.input.substring(0,10)].name, tx.blockNumber);
            }
        }else {
            if(option.all || option.printTx)
                console.log(tx.hash, tx.from==creator?"creator":"user"+UserIdMap[tx.from],"fallback",    (tx.isError=="0" && tx.txreceipt_status!="0") ?"success":"fail");
         
            if(option.all || option.printBlockNumber){
                console.log(tx.hash, tx.from==creator?"creator":"user"+UserIdMap[tx.from], "fallback", tx.blockNumber);
        }
        }
    }
    if(option.all || option.printUser){
        console.log("totally ",Users.size, " users");
        console.log("totally ", MethodCount, " different functions are invoked");
        console.log("functions: ", Methods);
    }
}
var option = {};
async function main(){
    let args = process.argv.slice(2);
    let optionHelp = `\n--help  usage instruction
                      \n--all  print all information
                      \n--tx  print only transactions information
                      \n--user  print only users statistics
                      \n--abi  print contract ABI
                      \n--txHash print only transaction hashes
                      \n--bn  print blocknumber`;
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
          case "--tx":{
            option.printTx = true;
            break;
          }
          case "--user":{
            option.printUser = true;
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
    let address = "0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB";
    let name = "CryptoPunks";
    await getSource(address, name);
    loadABI(name);
    await getTransactions(53598);
    await filter();
}

main();
