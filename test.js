const fs = require("fs")
const path = require("path")
const Timeout = require('await-timeout');
console.log(Timeout);

const EthereumContractKit = require("./server/connection/ethereum/fuzzer").EthereumContractKit;
const EthereumFuzzer = require("./server/connection/ethereum/fuzzer").EthereumFuzzer;

const deployer = EthereumContractKit.getInstance("./deployed_contract");
const accounts = deployer.accounts

const compile = require("./server/utils/compile")
const benchmark = path.join(__dirname, "examples")
const now = () =>{
    return Math.floor(Date.now() / 1000)
}

const timeoutawait = async (func) =>{
    const timer = new Timeout();
    try {
        await Promise.race([
          func(),
          timer.set(1000, 'Timeout!')
        ]);
      } finally {
        timer.clear();
      }
}

const range = (k)=>{
    return [...Array(k).keys()]
}
const print = console.log 
const isDir = function(path){
        return fs.lstatSync(path).isDirectory()
}
const fetchContractName = function(contractdir){
    let dirs = fs.readdirSync(contractdir)
    let contracts = []
    for (let dir of dirs){
        if (dir.indexOf(".json")!=-1){
            targetContract =  dir.split(".json")[0]
        }
        if (dir.indexOf(".sol")!=-1){
            contracts.push({contract: dir.split(".sol")[0]+".sol"})
        }
    }
    return {targetContract: targetContract, contracts: contracts}
}
const rand = function(max){
    return Math.floor(Math.random()*max)
}

function getCaseIterator(folder, ignore="blockchain"){
    let dirs = fs.readdirSync(folder)
    print(dirs)
    
    let end = dirs.length
    print(end)

    let start = 0
    let nextIndex = start 
    let iterationCount = 0

    const rangeIterator = {
        next: function(){
            let result
            if (nextIndex<end)
            while (! isDir(path.join(folder, dirs[nextIndex])) || dirs[nextIndex] == ignore){
                nextIndex += 1
            }
            if (nextIndex<end){
                contractdir = path.join(folder, dirs[nextIndex], "ethereum")
                contractResult = fetchContractName(contractdir)
                result = {value: contractdir, contracts: contractResult.contracts, contract_name: contractResult.targetContract, done: false}
                nextIndex += 1
                iterationCount ++
                return result
            }
            return {value: iterationCount, done: true}
        }
    }
    return rangeIterator
}
const creatorConfigs = {
    "AssetTransfer":{
        constructor: "constructor",
        creatorparam: ["description: this is asset transfer contract", 100]
    },
    "BasicProvenance":{
        constructor: "constructor",
        creatorparam: [accounts[1], accounts[2]]
    },
    "Bazaar":{
        constructor: "constructor",
        creatorparam: [accounts[1], 1000, accounts[2], 2000]
    },
    "DefectiveComponentCounter":{
        constructor: "constructor",
        creatorparam: [[1,2,3,4,5,6,7,8,9,10,11,12]]
    },
    "DigitalLocker":{
        constructor: "constructor",
        creatorparam: ["Alice", accounts[1]]
    },
    "FrequentFlyerRewardsCalculator":{
        constructor: "constructor",
        creatorparam: [accounts[1], 100]
    },
    "HelloBlockchain":{
        constructor: "constructor",
        creatorparam: ["description: this is hello blockchain"]
    },
   
    "RefrigeratedTransportation":{
        constructor: "constructor",
        creatorparam: [accounts[1], accounts[2], accounts[3], 10, 50,  10, 50]
    },
    "RoomThermostat":{
        constructor: "constructor",
        creatorparam: [accounts[1], accounts[2]]
    },
    "SimpleMarketplace":{
        constructor: "constructor",
        creatorparam: ["description: this is hello blockchain", 1000]
    },
    
    // PingPong Game 
    // "Player":{
    //     constructor: "",
    //     creatorparam: {}
    // },
    // "Starter":{
    //     constructor: "",
    //     creatorparam: {}
    // }


}
class RandomGenerator{
    constructor(contract){
        this.case = contract; 
        this.pass =  0;
        this.deployer = deployer
        this.receipts = []
        this.passMax = 20
        this.transactionMax = 500
        this.seed = 10 
        this.succTx = 0

        this.pass = 0
        this.curTx = 0
    }
    testConnection(){
        this.deployer.testBlockchainNetworkConnection()
    }
    async deploy(){
        print("deploy ", this.case)
        if (!(this.case.contract_name in creatorConfigs) ||  creatorConfigs[this.case.contract_name].constructor == "")
            return false 
        let result = await this.deployer.deploy_contract_precompiled_params(this.case.contract_name, creatorConfigs[this.case.contract_name].constructor, creatorConfigs[this.case.contract_name].creatorparam); 
        this.instance = result.instance;
        result.receipt.from += "#"+this.pass
        this.receipts.push(result.receipt);
        this.fuzzer = new EthereumFuzzer(this.seed, this.case.contract_name)
        return true 
    }
    async randomtransactiongeneration(){
        if (this.fuzzer == undefined )
            return; 
        let ret = await this.fuzzer.fuzz_contract(this.case.contract_name, this.instance.address)
        ret.receipt.receipt.from += "#"+this.pass;
        if (ret.receipt.receipt.status == "0x0"){
            this.succTx ++ ;
            this.receipts.push(ret.receipt.receipt)
        }

        // this.fuzzer.fuzz_contract(this.case.contract_name, this.instance.address).then(ret => {
        //     ret.receipt.receipt.from += "#"+this.pass;
        //     if (ret.receipt.receipt.status == "0x0"){
        //         this.succTx ++ ;
        //         this.receipts.push(ret.receipt.receipt)
        //     }
        // })
    }

    async onePass(){
        const timer = new Timeout();
        try {
            await Promise.race([
              this.deploy(),
              // 30*1000 ms
              timer.set(30*1000, 'Timeout!')
            ]);
        } catch(err){
            print(this.case.contract_name, creatorConfigs[this.case.contract_name].creatorparam, err)
            print(err)
            return 
        } finally {
            this.transactionNo = 0
            timer.clear();
        }

        // try{
        //     await timeoutawait(this.deploy);
        //     // if (!flag)
        //     //     return 
        //     this.transactionNo = 0
        // }catch(err){
        //     print(this.case.contract_name, creatorConfigs[this.case.contract_name].creatorparam, err)
        //     print(err)
        //     return 
        // };
        let batch = 20;
        for (let i=0; i* batch <this.transactionMax; i++ ){
            await Promise.all(range(batch).map(async (i) =>{
                const timer = new Timeout();
                try {
                    await Promise.race([
                        this.randomtransactiongeneration(),
                        // 30*1000 ms
                        timer.set(30*1000, 'Timeout!')
                    ]);   
                } catch (error) {
                    // print(error)
                }
                print("generate random transaction#",this.transactionNo++)
            }))
        }
        
        print("finished pass#",this.pass++)
    }

    async process(){
        this.testConnection();
        for (let k=0; k<this.passMax; k++){
           await this.onePass()
        }
        this.save2file()
        return this;
    }

    // async process(){
    //     this.testConnection();
    //     for (let k=0; k<this.passMax; k++){
    //         let flag = await this.deploy();
    //         if (!flag)
    //             return 
    //         this.transactionNo = 0
    //         for (let i=0; i<this.transactionMax; i++){
    //             try {
    //                 await this.randomtransactiongeneration()    
    //             } catch (error) {
    //                 print("")
    //             }
    //             print("generate random transaction#",this.transactionNo++)
    //         }
    //         print("finished pass#",this.pass++)
    //     }
    //     return this;
    // }
    save2file(){
        if ( ! fs.existsSync("./transactions"))
            fs.mkdirSync("./transactions")
        fs.writeFile(path.join("./transactions", this.case.contract_name + ".json"), JSON.stringify(this.receipts),(err) => {
            if (err) throw err;
            console.log('The file has been saved!');
          });
    }
}

async function  main() {
    let start = now();
    const it = getCaseIterator(benchmark);
    let result = it.next();
    let startIndex = 10;
    let i = 0; 
    while(!result.done){
        // if (i<startIndex){
        //     i++;
        //     result = it.next()
        //     continue    
        // }
        print(result.value)
        // if (result.value.indexOf("basic-provenance")!=-1 
        if ( result.value.indexOf("bazaar")!=-1){
            compile.compile(result.value, result.contracts);
            await (new RandomGenerator(result)).process();
        }
        result = it.next()
        print("used time: ", now()-start)
    }
    print("total cases:", result.value)    
}


main();

// BasicProvenance