// C:\Program Files\NVIDIA Corporation\NVSMI\nvidia-smi.exe
const fs 				= require('fs');
const exec 			= require('child_process').exec
const treeKill 	= require('tree-kill')

let children = []
let precessKill = code => { children.forEach(child => { treeKill(child.pid) }) }

module.exports = (command, cb) => {
  let child = exec(command)
  child.stdout.on('data', data => cb(data.toString(), 'stdout'))
  child.stderr.on('data', data => {
		console.log(`${chalk.red(data)}`);
  })
  child.on('exit', precessKill)
  children.push(child)
}