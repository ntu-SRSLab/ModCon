
const UserAccount = "0x0x144d5ca47de35194b019b6f11a56028b964585c9";
function types(inputs) {
    let input_types = [];
    if(inputs && inputs.length>=1)
        for (let input of inputs)
            input_types.push(input.type);
    return input_types.join();
}


function write2file(file, content) {
    const fs = require("fs");
    fs.writeFile(file, content, function(err) {
        if (err) throw err;
        console.log(file + ' Saved!');
    });
}

function readJSON(file) {
    const fs = require("fs");
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

exports.readJSON = readJSON;
exports.write2file = write2file;
exports.types = types;
exports.UserAccount = UserAccount;

