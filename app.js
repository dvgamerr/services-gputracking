// C:\Program Files\NVIDIA Corporation\NVSMI\nvidia-smi.exe
const clear 	= require("clear")
const chalk 	= require('chalk')
const os 			= require('os')
const request = require('request-promise')
const moment 	= require('moment')
const r 			= require('rethinkdb')
const cron 		= require('cron')

const nvidia 	= require('./nvidia-smi')
const slack 	= require('./slack-webhook')
// **GPU#0** GeForce GTX 1080 Ti 11GB - Temperature: `84 °C` Power: `245.54 W`
let isOverheat = false, atOverheat = null
let min = 100, max = 0
let graph = {
	update: new Date(),
	payment: null,
	exchange: 0,
	balance: 0.0,
	unpaid: 0,
	gpu: []
}

// 
let exchange = () => request({
	url: `https://blockchain.info/th/ticker`,
	json: true
}).then(res => {
	graph.exchange = res['THB'].sell
	// console.log(`${res['THB'].sell} ${res['THB'].symbol}`)
})

let unpaid = () => request({
	url: `https://api.nicehash.com/api?method=stats.provider&addr=386kZA5f7XkBrehmUxpMHeEkEQJ9TvTqWB`,
	json: true
}).then(res => {
	graph.unpaid = 0.0 
	res.result.stats.forEach(item => {
		graph.unpaid += parseFloat(item.balance)
	})
	if (res.result.payments.length > 0 && graph.payment != res.result.payments[0].time) {
		graph.payment = res.result.payments[0].time
		balance()
	}
})

let balance = () => request({
	url: `https://api.nicehash.com/api?method=balance&id=195158&key=c81830fc-2f6b-4f60-b6dc-cca004113809`,
	json: true
}).then(res => {
	graph.balance = res.result.balance_confirmed
	// console.log('balance_confirmed', res.result.balance_confirmed)
})

let colorTemp = (temp, unit) => (temp >= 80 ? (temp >= 90 ? chalk.red(temp, unit) : chalk.yellow(temp, unit)) : chalk.green(temp, unit));
let colorPower = (temp, unit) => (temp >= 220 ? (temp >= 250 ? chalk.red(temp, unit) : chalk.yellow(temp, unit)) : chalk.green(temp, unit));
let normalization = (gpu) => {
	if (gpu.temp < min) min = gpu.temp
	if (gpu.temp > max) max = gpu.temp
  console.log(`  - GPU#${gpu.index} ${gpu.name} ${parseInt(gpu.memory.total / 1024)}GB --- GPU: ${chalk.magenta(gpu.ugpu)} Memory: ${chalk.magenta((gpu.memory.used * 100 / gpu.memory.total).toFixed(1),'%')} Temperature: ${colorTemp(gpu.temp,'°C')} Power: ${!gpu.power ? chalk.red('N\\A') : colorPower(gpu.power,'W')} Speed: ${!gpu.fan ? chalk.red('N\\A') : gpu.fan}`)
  if ((gpu.temp >= 85 || gpu.temp < 60) && !isOverheat) {
  	let message = `*GPU#${gpu.index}:* \`${gpu.ugpu}\` Temperature: \`${gpu.temp}°C\` Power: \`${!gpu.power ? 'N\\A' : `${gpu.power} W`}\``
		slack.hook(`${(process.argv[2] ? `[${process.argv[2]}]` : '')}`, message).then((res) => {
			if (res === 'ok') console.log('error', res)
		})
  	isOverheat = true
  	atOverheat = new Date()
  } else if (isOverheat) {
  	if (new Date() - atOverheat > 90000) isOverheat = false
  }
}

if (process.argv[2]) {
	r.connect({ host: 'aws.touno.co', port: 6511 }, function(err, conn) {
		conn.use('miner')
		nvidia.watch({ interval: 1 })
		nvidia.on('gpu', gpu => {
	    r.table('gpu_stats').insert({ 
	    	miner: process.argv[2], gpu: {
		     index: gpu.index,
		     date: gpu.date.toDate(),
		     name: gpu.name,
		     device: gpu.device,
		     bus: gpu.bus,
		     domain: gpu.domain,
		     temp: gpu.temp,
		     ugpu: gpu.ugpu,
		     umemory: gpu.umemory,
		     power: gpu.power,
		     clocks: gpu.clocks,
		     fan: gpu.fan,
		     memory: gpu.memory
	    	} 
	  	}).run(conn)
			graph.update = gpu.date
			graph.gpu[gpu.index] = gpu
		});
  })


	setInterval(() => {
		clear()
		console.log('')
		console.log(`                                 Computer Name: ${os.hostname()} [${process.argv[2]}][${graph.gpu.length}]`)
		console.log(`                                        INFO.DVGAMER@GMAIL.COM`)
		console.log(`            ${`Unpaid: ${chalk.green((graph.unpaid * graph.exchange).toFixed(2),'THB')} (${graph.unpaid}) BTC          Balance: ${chalk.green((graph.balance * graph.exchange).toFixed(2),'THB')}`} (${graph.balance}) BTC`)
		console.log(' ------------------------------------------------------------------------------------------------------')
		console.log(` List GPU update at ${graph.update.format('DD MMMM YYYY HH:mm:ss.SSS')} `)
		graph.gpu.forEach((item) => {
			normalization(item)
		})
	}, 1000)

	unpaid()
	exchange()

	// Get Unpaid balance
	new cron.CronJob({
	  cronTime: '* * * * *',
	  onTick: unpaid,
	  start: true,
	  timeZone: 'Asia/Bangkok'
	});

	// Exchange rate
	new cron.CronJob({
	  cronTime: '*/15 * * * *',
	  onTick: exchange,
	  start: true,
	  timeZone: 'Asia/Bangkok'
	});

}