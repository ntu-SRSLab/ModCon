const { assert } = require("console");
const fs = require("fs");
const web3 = require("web3-eth-abi");
const request = require('request');
const sleep = require('sleep');
var HashMethodMap = new Map();
String.prototype.format = function() {
    a = this;
    for (k in arguments) {
      a = a.replace("{" + k + "}", arguments[k])
    }
    return a
  }
var api_key = "URF6R5PGNZ7CT6TTBU7M8NH5V8WRISHIZZ";
var url_contracts = "https://api.etherscan.io/api?module=account&action=txlist&address=0x2A46f2fFD99e19a89476E2f62270e0a35bBf0756&startblock={0}&endblock=99999999&sort=asc&apikey={1}";
function GET(url) {
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
async function getTransactions(transactions_number){
    let result = [];
    let start = 0;
    for (let i=0; i<Math.floor(transactions_number/10000)+1; i++){
        body = await GET(url_contracts.format(start,api_key));
        result = result.concat(JSON.parse(body).result);
        start = parseInt(result[result.length-1].blockNumber)+1;
    }
    return {result:result};
}   
function loadABI(){
    let count = 0;
    let ABIs = JSON.parse(fs.readFileSync("./abi.json"));
    for (let abi of ABIs){
        if((false == abi.constant|| "view"==abi.stateMutability) && abi.type == "function"){
        // if(abi.type == "function"){
            // console.log(abi);
            let hash = web3.encodeFunctionSignature(abi);
            console.log(abi.name, hash);
            HashMethodMap[hash] = abi;
            count ++;
        }
    }
    console.log("totally ", count, " non-constant public functions");
}

async function filter(){
    let json ={result: JSON.parse(fs.readFileSync("./tx.json"))};
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
        if(tx.input == ""||tx.input == "0x")
            console.log(tx.from==creator?"creator":"user"+UserIdMap[tx.from], "fallback", tx.isError=="0"?"success":"fail");
        else if (HashMethodMap[tx.input.substring(0,10)]){
            if (!Methods[HashMethodMap[tx.input.substring(0,10)].name]){
                Methods[HashMethodMap[tx.input.substring(0,10)].name]=1;
                MethodCount ++;
            }
            else 
                Methods[HashMethodMap[tx.input.substring(0,10)].name]+=1;
            console.log(tx.from==creator?"creator":"user"+UserIdMap[tx.from], 
            HashMethodMap[tx.input.substring(0,10)].name + " " +(
            HashMethodMap[tx.input.substring(0,10)].name == "createGame"? (tx.isError=="0"?gameIdCntr++: "failure"):
            HashMethodMap[tx.input.substring(0,10)].name.indexOf("serverEndGame")!=-1?web3.decodeParameters(HashMethodMap[tx.input.substring(0,10)].inputs, "0x"+tx.input.slice(10))._gameId:
            "")
            , 
            tx.isError=="0"?"success":"fail");
            // console.log(HashMethodMap[tx.input.substring(0,10)].inputs, tx.input);
            // console.log(web3.decodeParameters(HashMethodMap[tx.input.substring(0,10)].inputs, "0x"+tx.input.slice(10)));
        }else {
          
            console.log(tx.input, "unknown");
            break;
        }
    }
    console.log("totally ",Users.size, " users");
    console.log("totally ", MethodCount, " different functions are invoked");
    console.log("functions: ", Methods);
}

async function main(){
    loadABI();
    // let json = await getTransactions(57052);
    // fs.writeFileSync("./tx.json",JSON.stringify(json.result));
    await filter();
}

main();
