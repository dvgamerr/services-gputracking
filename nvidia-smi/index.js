const fs 			= require('fs')
const moment 	= require('moment')
const events 	= require('events')
const spawn 		= require('child_process').spawn
const emiter 	= new events.EventEmitter()

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
	this.power = obj[11] === '[Not Supported]' ? null : parseFloat(obj[11])
	this.clocks = parseInt(obj[12])
	this.fan = obj[13] === '[Not Supported]' ? null : obj[13]
	this.memory = {
		total: parseInt(obj[8]),
		free: parseInt(obj[9]),
		used: parseInt(obj[10])
	}
}

emiter.watch = function(config) {
	let line = ''
	let total = -1
	let NVSMIx64 	= `C:/Program Files/NVIDIA Corporation/NVSMI/nvidia-smi.exe`;
	if (fs.existsSync(`${NVSMIx64}`)) {
		let ls = spawn(NVSMIx64, [`--query-gpu=${query.join(',')}`,`--format=csv`,`-l`,`${config.interval || 1}`])

		ls.stdout.on('data', (data) => {
			line += data
			if (/\r\n/ig.test(line)) {
				total++
				if (total > 0) { 
					let gpu = new smi(line.replace('\r\n',''))
					emiter.emit('gpu', gpu);
				}
				line = ''
			}
		});

		ls.stderr.on('data', (data) => {
		  console.log(`stderr: ${data}`);
		});

		ls.on('close', (code) => {
		  console.log(`child process exited with code ${code}`);
		});


	} else {
		throw `Please install nvidia driver and check 'nvidia-smi.exe'.`
	}
}

module.exports = emiter