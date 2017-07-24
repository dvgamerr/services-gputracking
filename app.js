// C:\Program Files\NVIDIA Corporation\NVSMI\nvidia-smi.exe
const clear 	= require("clear")
const chalk 	= require('chalk')
const moment 	= require('moment')
const os 			= require('os')
const exec 		= require('./lib/process')

let query = [
	'timestamp',
	'name',
	'pci.bus_id',
	'temperature.gpu',
	'utilization.gpu',
	'utilization.memory',
	'memory.total',
	'memory.free',
	'memory.used'
]
var smi = function(data) {
	// 2017/07/24 10:46:40.840, GeForce 940MX, 0000:01:00.0, 39, 0 %, 0 %, 2048 MiB, 2021 MiB, 27 MiB
	let obj = /([\d:\.\/ ]+),.(.+?),.([\d:\.]+),.(\d+?),.([\d %]+?),.([\d %]+?),.([\d]+).MiB,.([\d]+.)MiB,.([\d]+).MiB/ig.exec(data)
	// domain:bus:device.function
	let vender = /(\d{4}):(\d{2}):(\d{2}).(\d)/ig.exec(obj[3])
	this.date = moment(obj[1], 'YYYY/MM/DD hh:mm:ss.SSS')	// 2017/07/24 12:18:41.852
	this.name = obj[2]

	this.device = parseInt(vender[3])
	this.bus = vender[2]
	this.domain = vender[1]

	this.temp = obj[4]
	this.ugpu = obj[5]
	this.umem = obj[6]
	this.memory = {
		total: parseInt(obj[7]),
		free: parseInt(obj[8]),
		used: parseInt(obj[9])
	}
}
let i = 0;
let onWait = setInterval(function() {
  process.stdout.clearLine();  // clear current text
  process.stdout.cursorTo(0);  // move cursor to beginning of line
  i = (i + 1) % 4;
  process.stdout.write(`Process GPU${new Array(i + 1).join('.')}`);  // write text
}, 400);

let normalization = (data) => {
	let gpu = new smi(data)
	clear()
	let gPercent = `GPU: ${chalk.magenta(gpu.ugpu)} Memory:  ${chalk.magenta((gpu.memory.used * 100 / gpu.memory.total).toFixed(1))} %`
  console.log(`Computer Name: ${chalk.blue(os.hostname())} (last update at ${gpu.date.format('DD MMMM YYYY HH:MM:ss.SSS')})`)
  console.log(`${chalk.bgGreen(`GPU#${gpu.device} ${gpu.name}`)} (${gpu.temp} °C) ${gPercent}`)
}

// ([\d:\.\/ ]+),.(.+?),.([\d:\.]+),.(\d+?),.([\d %]+?),.([\d %]+?),.([\d]+.MiB),.([\d]+.MiB),.([\d]+.MiB)
let line = ''
let total = -1
exec(require('./nvidia-smi/query')(query), data => {
	line += data
	if (/\r\n/ig.test(line)) {
		total++
		if (total > 0) { 
			clearInterval(onWait)
			normalization(line.replace('\r\n',''))
		}
		line = ''
	}
})