// C:\Program Files\NVIDIA Corporation\NVSMI\nvidia-smi.exe
const term 		= require( 'terminal-kit' ).terminal
const os 			= require('os')
const request = require('request-promise')
const moment 	= require('moment')
const numeral = require('numeral')
const r 			= require('rethinkdb')
const cron 		= require('cron')

const line = require('@line/bot-sdk');
const client = new line.Client({
  channelAccessToken: 'aLWtThxKjje3XZPX9MMczLk/0tHwqCN7OVcfbfLSKFAMb8aLSL7VGW9xX/SeSCCEjE/N8TEiKTMJmOzWPrPvx3Ki03ezUhlS8CE8XkKNOLjlugrrXbD5lrpD4IAsehEleBS+mNcAjfLTtRim7qaeWQdB04t89/1O/w1cDnyilFU='
});

const nvidia 	= require('./nvidia-smi')
const slack 	= require('./slack-webhook')
// **GPU#0** GeForce GTX 1080 Ti 11GB - Temperature: `84 °C` Power: `245.54 W`
let isOverheat = false, atOverheat = null
let min = 100, max = 0
let graph = {
	update: moment(),
	payment: null,
	exchange: 0,
	balance: 0.0,
	unpaid: 0,
	amount: 0,
	gpu: []
}

// 
let exchange = () => request({
	url: `https://blockchain.info/th/ticker`,
	json: true
}).then(res => {
	graph.exchange = res['THB'].sell
	// console.log(`${res['THB'].sell} ${res['THB'].symbol}`)
}).catch((err) => {
  console.log(err)
});

let unpaid = () => request({
	url: `https://api.nicehash.com/api?method=stats.provider&addr=386kZA5f7XkBrehmUxpMHeEkEQJ9TvTqWB`,
	json: true
}).then(res => {
	graph.unpaid = 0.0 
	res.result.stats.forEach(item => {
		graph.unpaid += parseFloat(item.balance)
	})
	graph.amount = 0.0 
	res.result.payments.forEach(item => {
		graph.amount += parseFloat(item.amount)
	})
	graph.amount = graph.amount / res.result.payments.length

	if (res.result.payments.length > 0 && graph.payment != res.result.payments[0].time) {
		graph.payment = res.result.payments[0].time
		balance()
	}
}).catch((err) => {
  console.log(err)
});

let balance = () => request({
	url: `https://api.nicehash.com/api?method=balance&id=195158&key=c81830fc-2f6b-4f60-b6dc-cca004113809`,
	json: true
}).then(res => {
	graph.balance = res.result.balance_confirmed
	// console.log('balance_confirmed', res.result.balance_confirmed)
}).catch((err) => {
  console.log(err)
});

let colorTemp = temp => (temp >= 80 ? (temp >= 90 ? temp : temp) : temp);
let colorPower = temp => (temp >= 220 ? (temp >= 250 ? temp : temp) : temp);
let normalization = (gpu, i) => {
	if (gpu.temp < min) min = gpu.temp
	if (gpu.temp > max) max = gpu.temp

	term.moveTo(1, 6+i , `- GPU#${gpu.index} ${gpu.name} ${parseInt(gpu.memory.total / 1024)}GB --- GPU: ${(gpu.ugpu)} Memory: ${(gpu.memory.used * 100 / gpu.memory.total).toFixed(1)}% Temperature: ${colorTemp(gpu.temp)}°C Power: ${!gpu.power ? ('N\\A') : colorPower(gpu.power)} W Speed: ${!gpu.fan ? ('N\\A') : gpu.fan}`)

  if ((gpu.temp >= 85 || gpu.temp < 60) && !isOverheat) {
  	let slack_text = `*GPU#${gpu.index}:* \`${gpu.ugpu}\` Temperature: \`${gpu.temp}°C\` Power: \`${!gpu.power ? 'N\\A' : `${gpu.power} W`}\``
  	let line_text = `${gpu.name}#${gpu.index}
 GPU: ${gpu.ugpu} Temperature: ${gpu.temp}°C P: ${!gpu.power ? 'N\\A' : `${gpu.power} W`}`
		// slack.hook(`${(process.argv[2] ? `[${process.argv[2]}]` : '')}`, slack_text).then((res) => {
		// 	if (res === 'ok') console.log('error', res)
		// })

		client.pushMessage('U99a557887fe970d1e51dcef21f2fc278', { type: 'text', text: line_text }).then(() => {
		  
		}).catch((err) => {
		  console.log(err)
		});

  	isOverheat = true
  	atOverheat = new Date()
  } else if (isOverheat) {
  	if (new Date() - atOverheat > 90000) isOverheat = false
  }
}

if (process.argv[2]) {
	r.connect({ host: 'aws.touno.co', port: 6511 }, function(err, conn) {
	// r.connect({ host: 'localhost', port: 28015 }, function(err, conn) {
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
		let unpaid = `Unpaid: ${numeral(graph.unpaid * graph.exchange).format('0,0.00')} THB (${(graph.unpaid).toFixed(8)}) BTC`
		let balance = `Balance: ${numeral(graph.balance * graph.exchange).format('0,0.00')} THB (${graph.balance}) BTC`
		let daily = `Daily: ${numeral(graph.amount * graph.exchange).format('0,0.00')} THB (${graph.amount.toFixed(8)}) BTC`
		let monthly = `Monthly: ${numeral((graph.amount * 30) * graph.exchange).format('0,0.00')} THB`
		let exchange = `(1 BTC = ${numeral(graph.exchange).format('0,0.00')} THB)`

		// console.log('')
		// console.log(`                      Computer Name: ${os.hostname()} [${process.argv[2]}][${graph.gpu.length}] | ${exchange}`)
		// console.log(`             ${daily}         ${monthly}`)
		// console.log(`            ${unpaid}          ${balance}`)
		// console.log('  ------------------------------------------------------------------------------------------------------')
		// console.log(`  List GPU update at ${graph.update.format('DD MMMM YYYY HH:mm:ss.SSS')} `)
		let header = `Computer Name: ${os.hostname()} [${process.argv[2]}][${graph.gpu.length}]`
		term.moveTo((term.width / 2) - (header.length / 2),2, header)
		term.moveTo(10,3, exchange)
		term.moveTo(40,3, daily)
		term.moveTo(80,3, monthly)
		term.moveTo(1,4, `${unpaid}          ${balance}`) ;
		term.moveTo(1,5, `List GPU update at ${graph.update.format('DD MMMM YYYY HH:mm:ss.SSS')}`)
		graph.gpu.forEach((item, i) => {
			normalization(item, i)
		})
		term.white('\n')
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