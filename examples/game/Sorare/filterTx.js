const { assert } = require("console");
const fs = require("fs");
const web3 = require("web3-eth-abi");
var HashMethodMap = new Map();
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

function filter(){
    let json = JSON.parse(fs.readFileSync("./tx.json"));
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
        if(tx.input == "")
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
            Methods.add("UNKOWN");
            console.log(HashMethodMap[tx.input.substring(0,10)].inputs, tx.input, "unknown");
            break;
        }
    }
    console.log("totally ",Users.size, " users");
    console.log("totally ", MethodCount, " different functions are invoked");
    console.log("functions: ", Methods);
}
loadABI();
// filter();

