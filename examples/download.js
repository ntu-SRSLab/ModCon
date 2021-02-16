const { assert } = require("console");
const fs = require("fs");
const request = require('request');
const sleep = require('sleep');

String.prototype.format = function() {
    a = this;
    for (k in arguments) {
      a = a.replace("{" + k + "}", arguments[k])
    }
    return a
  }
var api_key = "URF6R5PGNZ7CT6TTBU7M8NH5V8WRISHIZZ";
var url_source = "https://api.etherscan.io/api?module=contract&action=getsourcecode&address={1}&apikey={0}";
var url_abi = "https://api.etherscan.io/api?module=contract&action=getabi&address={1}&apikey={0}";
var url_txs = "https://api.etherscan.io/api?module=account&action=txlist&address={2}&startblock={0}&endblock=99999999&sort=asc&apikey={1}";
var url_events = "https://api.etherscan.io/api?module=logs&action=getLogs&fromBlock={0}&toBlock={1}&address=0x2A46f2fFD99e19a89476E2f62270e0a35bBf0756&topic0={2}&apikey={3}";

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

async function getTransactions(contract, address, transactions_number){
     // check whether all transactions has been downloaded.
    // if downloaded, skip and return;
    // otherwise, download it from etherscan.
    if(fs.existsSync("./data/"+contract+"-tx.json")){
        return;
    }
    let result = [];
    let start = 0;
    try {
        for (let i=0; i<Math.floor(transactions_number/10000)+1; i++){
          let body = await GET(url_txs.format(start,api_key, address));
          // console.log(body);
          result = result.concat(JSON.parse(body).result);
          console.log(result.length);
          start = parseInt(result[result.length-1].blockNumber)+1;
      }
      fs.writeFileSync("./data/"+contract+"-tx.json",JSON.stringify(result));
    } catch (error) {
      console.error(error);
    }
   
    return;
}
// get contract ABI
async function getABI(contract, address){
   let body = await GET(url_abi.format(api_key, address))  
  
   fs.writeFileSync("./data/"+contract+"-abi.json",JSON.stringify(JSON.parse(JSON.parse(body).result)));
   return;
}

// get contract source code
async function getSourceCode(contract, address){
    let body = await GET(url_source.format(api_key, address))
    let sourceCode = JSON.parse(body).result[0].SourceCode;
    try {
      let contents = "";
      for (let subContract of Object.keys(JSON.parse(sourceCode))){
        contents += JSON.parse(sourceCode)[subContract].content +"\n";
      }
      fs.writeFileSync("./data/"+contract+".sol", contents)
    } catch (error) {
      fs.writeFileSync("./data/"+contract+".sol",sourceCode); 
    }
    return;
 }

var option = {};
async function main(){
    let args = process.argv.slice(2);
    console.log(args);
    let optionHelp = `\n--help  usage instruction
                      \n--contract  contract name
                      \n--address   contract address
                      \n--transactions   transactions number
                      `;
    if (args.length==0){
        option.all = true;
    }

    for(let i=0; i<args.length; i++){
        switch(args[i]){
          case  "--help": {
              console.log(optionHelp);
              process.exit(0);
          }
          case "--contract":{
            option.contract = args[i+1];
            i++ ;
            break;
          } 
          case "--address":{
            option.address =  args[i+1];
            i++;
            break;
          } 
          case "--transactions":{
            option.transactions_number = parseInt(args[i+1]);
            i++;
            break;
          } 
          default:{
            console.log(optionHelp);
            process.exit(0);
          }        
        }
    }
    assert(option.contract, "error: contract not set\n"+optionHelp)
    assert(option.address, "error: address not set\n"+optionHelp)
    await getSourceCode(option.contract, option.address);
    await getABI(option.contract, option.address);
    await getTransactions(option.contract, option.address, option.transactions_number);
}

main();
