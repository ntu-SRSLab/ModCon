const fs = require("fs")
const path = require("path")

const compile = require("./server/utils/compile")
const benchmark = path.join("./", "examples")

const print = console.log 

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
            if (nextIndex<end){
                result = {value: dirs[nextIndex], done: false}
                nextIndex += 1
                iterationCount ++
                return result
            }
            return {value: iterationCount, done: true}
        }
    }
    return rangeIterator
}

const it = getCaseIterator(benchmark)
let result = it.next()
while(!result.done){
    print(result.value)
}
print("total cases:", result.value)