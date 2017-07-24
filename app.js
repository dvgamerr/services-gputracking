// C:\Program Files\NVIDIA Corporation\NVSMI\nvidia-smi.exe
const clear 	= require("clear")
const chalk 	= require('chalk')
const moment 	= require('moment')
const os 			= require('os')
const exec 		= require('./lib/process')

let query = [
	'index',
	'timestamp',
	'name',
	'pci.bus_id',
	'temperature.gpu',
	'utilization.gpu',
	'utilization.memory',
	'memory.total',
	'memory.free',
	'memory.used',
	'power.draw',
	'clocks.mem',
	'fan.speed'
]

var smi = function(data) {
	// 2017/07/24 10:46:40.840, GeForce 940MX, 0000:01:00.0, 39, 0 %, 0 %, 2048 MiB, 2021 MiB, 27 MiB
	let obj = /(\d{1,2}),.([\d:\.\/ ]+),.(.+?),.([\d:\.]+),.(\d+?),.([\d %]+?),.([\d %]+?),.([\d]+).MiB,.([\d]+.)MiB,.([\d]+).MiB,.(.+?),.(.+?)MHz,.(.+)/ig.exec(data)
	// domain:bus:device.function
	let vender = /(\d{4}):(\d{2}):(\d{2}).(\d)/ig.exec(obj[4])
	this.index = parseInt(obj[1])
	this.date = moment(obj[2], 'YYYY/MM/DD hh:mm:ss.SSS')	// 2017/07/24 12:18:41.852
	this.name = obj[3]

	this.device = parseInt(vender[3])
	this.bus = vender[2]
	this.domain = vender[1]

	this.temp = parseInt(obj[5])
	this.ugpu = obj[6]
	this.umemory = obj[7]
	this.power = obj[11]
	this.clocks = parseInt(obj[12])
	this.fan = obj[13]
	this.memory = {
		total: parseInt(obj[8]),
		free: parseInt(obj[9]),
		used: parseInt(obj[10])
	}
}
let i = 0;
let onWait = setInterval(function() {
  process.stdout.clearLine();  // clear current text
  process.stdout.cursorTo(0);  // move cursor to beginning of line
  i = (i + 1) % 4;
  process.stdout.write(`Process GPU${new Array(i + 1).join('.')}`);  // write text
}, 400);

let color = temp => temp >= 80 ? (temp >= 90 ? chalk.red(temp) : chalk.yellow(temp)) : chalk.green(temp);

let normalization = (gpu) => {
  console.log(`GPU#${gpu.index} ${gpu.name} ${parseInt(gpu.memory.total / 1024)}GB --- GPU: ${chalk.magenta(gpu.ugpu)} Memory: ${chalk.magenta((gpu.memory.used * 100 / gpu.memory.total).toFixed(1),'%')}
      Temperature: ${color(`${gpu.temp} °C`)} Power: ${gpu.power.indexOf('Not Supported') > -1 ? chalk.red(gpu.power) : gpu.power} Speed: ${gpu.fan}
`)
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
			clear()
			let gpu = new smi(line.replace('\r\n',''))
	  	console.log(`Computer Name: ${chalk.blue(os.hostname())} [${chalk.blue(process.argv[2])}] (update at ${gpu.date.format('DD MMMM YYYY HH:MM:ss.SSS')})`)
			normalization(gpu)
		}
		line = ''
	}
})