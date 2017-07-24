// C:\Program Files\NVIDIA Corporation\NVSMI\nvidia-smi.exe
const fs 				= require('fs');
const exec 			= require('child_process').exec

let precessCreated = (command, cb) => { 
	let child = exec(command) 
	child.stdout.on('data', data => cb(data.toString(), 'stdout'))
	child.on('exit', precessCreated)
}

module.exports = precessCreated