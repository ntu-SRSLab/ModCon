#!/usr/local/bin/node

const fs = require("fs");
const spath = require('path');
const shell = require("shelljs");
const { isRegExp } = require("util");

function checkSolcInstalled(version){
	const fs = require('fs');
	let installed = false;
	try {
		fs.accessSync('./node_modules/solc-'+version);
		installed = true;
	} catch (err) {
		installed = false;
	}
	return installed;
}

function write2File(dir, file_name, content) {
	if (!fs.existsSync(dir)) {
		shell.mkdir("-p", dir);
	}
	if (content)
		fs.writeFileSync(dir + "/" + file_name, content);
	else if (!fs.existsSync(dir + "/" + file_name)) {
		shell.mkdir("-p", dir + "/" + file_name);
	}
}

function compile(folder, contracts) {
	let output = {};
	let input = {};
	let version = "0.4.25";
	for (let contract of contracts) {
		input[contract.contract] = fs.readFileSync(spath.join(folder, contract.contract), 'utf8');
		let match =  input[contract.contract].match(/solidity\s+(>=|>|\^)(.*);/);
		if(match){
			version = match[2];
		}
	}
	console.log("solidity version: ", version);
	let compiledContract ;
	if (version.indexOf("0.4")!=-1){
		// install specific solc version
		if(false == checkSolcInstalled(version))
			shell.exec("npm install solc-"+version+"@npm:solc@"+version + " --save");
		let solc = require("solc-"+version);
		compiledContract = solc.compile({
			sources: input
		}, 1);
		console.log("keys:", Object.keys(compiledContract.sources));
		// console.log(compiledContract);
		for (let contract of Object.keys(compiledContract.contracts)) {
			let name = contract;
			let file_name = name.split(":")[0].split(".")[0];
			let contract_name = name.split(":")[1];
			console.log(file_name, contract_name);
		
			console.log(file_name, " to compile");
			let content = compiledContract.contracts[name];
			content.sourcePath = spath.join(__dirname, "../" + folder, file_name + ".sol");
			console.log(content.sourcePath);
			write2File("./deployed_contract/" + contract_name, contract_name + ".abi", JSON.stringify(JSON.parse(content.interface)));
			write2File("./deployed_contract/" + contract_name, contract_name + ".bin", content.bytecode);
			write2File("./deployed_contract/" + contract_name, contract_name + ".artifact", JSON.stringify(content));
			shell.cp("-f",content.sourcePath, spath.join(__dirname,"../deployed_contract/", contract_name));
			console.log(spath.join(__dirname,"../deployed_contract/", contract_name));
			output[contract_name] = JSON.parse(content.interface);
		
		}
		
	}else {
		    // try new version
		    if(false == checkSolcInstalled(version))
				shell.exec("npm install solc-"+version+"@npm:solc@"+version + " --save");
			let solc = require("solc-"+version);

			let standardInput = { language: "Solidity"};
			standardInput.sources = {};
			standardInput.settings = {
				outputSelection: {
				'*': {
					'*': ['*']
				}
				}
			};
			for (let contract of Object.keys(input)){
				standardInput.sources[contract]={
					content: input[contract]
				}
			}
			
			compiledContract =JSON.parse(solc.compile(JSON.stringify(standardInput)));
		
			console.log(compiledContract);
			for (let source  of Object.keys(compiledContract.contracts)){
						// console.log(source, compiledContract.contracts[source]);
						let file_name = source.split(".")[0];
						console.log(source, " compiled");
						for(let contract_name of Object.keys(compiledContract.contracts[source])){	
									let content = compiledContract.contracts[source][contract_name];
									content.sourcePath = spath.join(__dirname, "../" + folder, file_name + ".sol");
									console.log(content.sourcePath);
									write2File("./deployed_contract/" + contract_name, contract_name + ".abi", JSON.stringify(content.abi));
									// console.log(content.evm.bytecode);
									write2File("./deployed_contract/" + contract_name, contract_name + ".bin", JSON.stringify(content.evm.bytecode));
									write2File("./deployed_contract/" + contract_name, contract_name + ".artifact", JSON.stringify(content));
									shell.cp("-f",content.sourcePath, spath.join(__dirname,"../deployed_contract/", contract_name));
									output[contract_name] = content.abi;
						
						}
				
					}
	}
	console.log(output);
	return output;	
	
}

module.exports.compile = compile;