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
var url_txs = "https://api.etherscan.io/api?module=account&action=txlist&address={2}&startblock={0}&endblock=99999999&sort=asc&apikey={1}";
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
var url_events = "https://api.etherscan.io/api?module=logs&action=getLogs&fromBlock={0}&toBlock={1}&address={4}&topic0={2}&apikey={3}";

var logs = undefined;
async function getLogByTransactionHash(transactionHash){
    if (logs == undefined){
        logs = JSON.parse(fs.readFileSync("./logs.json"));
    }
    
    // console.log(transactionHash);
    let retLogs = logs.filter(log =>{
        return log.transactionHash == transactionHash;
    })
    if (retLogs.length<1){
        return "";
    }
    let topics = [LogBidCanceledTopic, LogBidAcceptedTopic, LogBidExpiredTopic,LogBidConfirmedTopic,LogBidCompletedTopic]
    let events = [LogBidCanceledEvent, LogBidAcceptedEvent, LogBidExpiredEvent,LogBidConfirmedEvent,LogBidCompletedEvent];
    for (let i=0; i<events.length; i++){
        let eventLog = retLogs.filter(log =>{
            return log.topics.includes(topics[i]);
        })
        if (eventLog.length>=1){
            let args = web3.decodeLog(events[i].inputs, retLogs[0].data);
            return args.bidId
        }
    }
    // console.log(args);
    return "";
}
async function getLogs(start, end, address){
    let topics = [LogBidCanceledTopic, LogBidAcceptedTopic, LogBidExpiredTopic,LogBidConfirmedTopic,LogBidCompletedTopic]
    let result = [];
    for (let topic of topics){
        let body = await GET(url_events.format(start, end, topic, api_key, address));
        // console.log(body);
        /**
         * parse event logs
         */
        let json = JSON.parse(body);
        result = result.concat(json.result);
    }
    return result;
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

async function getAllLogs(address){  
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
        createDigitalLogs = createDigitalLogs.concat(await getLogs(bn, maxBN, address));
        let newbn = parseInt(createDigitalLogs[createDigitalLogs.length-1].blockNumber);
        if (newbn == bn)
            break;
        else 
            bn = newbn;
    }
    fs.writeFileSync("./logs.json", JSON.stringify(createDigitalLogs));
}
async function getTransactions(transactions_number, address){
    // check whether all transactions has been downloaded.
    // if downloaded, skip and return;
    // otherwise, download it from etherscan.
    if(fs.existsSync("./tx.json")){
        return;
    }
    let result = [];
    let start = 0;
    for (let i=0; i<Math.floor(transactions_number/10000)+1; i++){
        let body = await GET(url_txs.format(start,api_key, address));
        console.log(JSON.parse(body).result.length+" txs");
        result = result.concat(JSON.parse(body).result);
        start = parseInt(result[result.length-1].blockNumber)+1;
    }
    fs.writeFileSync("./tx.json",JSON.stringify(result));
    return;
}

let LogBidCanceledEvent;
let LogBidCanceledTopic;
let LogBidAcceptedEvent;
let LogBidAcceptedTopic;
let LogBidExpiredEvent;
let LogBidExpiredTopic;
let LogBidConfirmedEvent;
let LogBidConfirmedTopic;
let LogBidCompletedEvent;
let LogBidCompletedTopic;

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
        }else if (abi.type == "event" && abi.name == "LogBidCanceled")
        {
            LogBidCanceledEvent = abi;
            LogBidCanceledTopic = web3.encodeEventSignature(LogBidCanceledEvent);
        }else if (abi.type == "event" && abi.name == "LogBidAccepted")
        {
            LogBidAcceptedEvent = abi;
            LogBidAcceptedTopic = web3.encodeEventSignature(LogBidAcceptedEvent);
        }else if (abi.type == "event" && abi.name == "LogBidExpired")
        {
            LogBidExpiredEvent = abi;
            LogBidExpiredTopic = web3.encodeEventSignature(LogBidExpiredEvent);
        }else if (abi.type == "event" && abi.name == "LogBidConfirmed")
        {
            LogBidConfirmedEvent = abi;
            LogBidConfirmedTopic = web3.encodeEventSignature(LogBidConfirmedEvent);
        }else if (abi.type == "event" && abi.name == "LogBidCompleted")
        {
            LogBidCompletedEvent = abi;
            LogBidCompletedTopic = web3.encodeEventSignature(LogBidCompletedEvent);
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
    for(let tx of json.result.slice(1)){
        // console.log(tx.input, tx.input.substring(0,11));
        Users.add(tx.from);
        if (undefined == UserIdMap[tx.from]){
            // assert(tx.from != creator);
            UserIdMap[tx.from] = id;
            id ++;
        }
        if(tx.input == ""||tx.input == "0x"){
            if(option.all || option.printTx)
                console.log(tx.from==creator?"creator":"user"+UserIdMap[tx.from], "fallback", " ", tx.isError=="0"?"success":"fail");
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
                let input = web3.decodeParameters(HashMethodMap[tx.input.substring(0,10)].inputs, "0x"+tx.input.slice(10));
                console.log(tx.from==creator?"creator":"user"+UserIdMap[tx.from], 
                HashMethodMap[tx.input.substring(0,10)].name + " "
                +
                (input!=undefined? 
                    (
                        input._bidId != undefined? input._bidId:
                        (await getLogByTransactionHash(tx.hash))   // check whether events have bidid information
                        )
                    :""
                )
                , 
                tx.isError=="0"?"success":"fail");
            }
            if(option.all || option.printBlockNumber){
                    console.log(tx.from==creator?"creator":"user"+UserIdMap[tx.from], HashMethodMap[tx.input.substring(0,10)].name, tx.blockNumber);
            }
        }else {
            if(option.all || option.printTx)
                console.log(tx.from==creator?"creator":"user"+UserIdMap[tx.from],"fallback", " ", tx.isError=="0"?"success":"fail");
         
            if(option.all || option.printBlockNumber){
                console.log(tx.from==creator?"creator":"user"+UserIdMap[tx.from], "fallback", tx.blockNumber);
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
          default:{
            console.log(optionHelp);
            exit(0);
          }        
        }
    }
    let address = "0x912b8f85E28B9ec196b48228159E2f13546836e6";
    let name = "AdEx";
    await getSource(address, name);
    loadABI(name);
    await getTransactions(255, address);
    await getAllLogs(address);
    await filter();
}

main();
