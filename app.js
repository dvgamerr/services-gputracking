// C:\Program Files\NVIDIA Corporation\NVSMI\nvidia-smi.exe
const term 		= require( 'terminal-kit' ).terminal
const os 			= require('os')
const request = require('request-promise')
const moment 	= require('moment')
const numeral = require('numeral')
const r 			= require('rethinkdb')
const cron 		= require('cron')

const apiId = process.env.NICEHASH_ID
const apiKey = process.env.NICEHASH_KEY
const wallet = process.env.NICEHASH_WALLET
const msgID = 'U99a557887fe970d1e51dcef21f2fc278'

const line = require('@line/bot-sdk');
const access_token = 'aLWtThxKjje3XZPX9MMczLk/0tHwqCN7OVcfbfLSKFAMb8aLSL7VGW9xX/SeSCCEjE/N8TEiKTMJmOzWPrPvx3Ki03ezUhlS8CE8XkKNOLjlugrrXbD5lrpD4IAsehEleBS+mNcAjfLTtRim7qaeWQdB04t89/1O/w1cDnyilFU='
const nvidia 	= require('./nvidia-smi')
const slack 	= require('./slack-webhook')
// **GPU#0** GeForce GTX 1080 Ti 11GB - Temperature: `84 °C` Power: `245.54 W`
let isOverheat = false, atOverheat = null
let min = 100, max = 0
let graph = {
	error: 0,
	days: 1,
	update: moment(),
	payment: null,
	exchange: 0,
	balance: 0.0,
	unpaid: 0,
	amount: 0,
	gpu: [],
	algo: []
}

const ALGO = [
	'Scrypt',
	'SHA256',
	'ScryptNf',
	'X11',
	'X13',
	'Keccak',
	'X15',
	'Nist5',
	'NeoScrypt',
	'Lyra2RE',
	'WhirlpoolX',
	'Qubit',
	'Quark',
	'Axiom',
	'Lyra2REv2',
	'ScryptJaneNf16',
	'Blake256r8',
	'Blake256r14',
	'Blake256r8vnl',
	'Hodl',
	'DaggerHashimoto',
	'Decred',
	'CryptoNight',
	'Lbry',
	'Equihash',
	'Pascal',
	'X11Gost',
	'Sia',
	'Blake2s',
	'Skunk'
]


let provider = () => request({
	url: `https://api.nicehash.com/api?method=stats.provider.ex&addr=${wallet}`,
	json: true
}).then(res => {
	if (!res.result.error) {
		let mine = res.result.past
		let max = 0
		for (let i = 0; i < mine.length; i++) {
			let second = 0
			let unpaid = 0
			for (let l = 0; l < mine[i].data.length - 1; l++) {
				let miner = parseFloat(mine[i].data[l+1][2]) - parseFloat(mine[i].data[l][2])
				if (miner > 0) {
					second += (mine[i].data[l+1][0] * 300) - (mine[i].data[l][0] * 300)
					unpaid += miner
				}
			}
			let hour = Math.floor(second / 3600)
			if (hour) {
				let day = (unpaid / hour) * 24
				if (day > max) max = day
			}
		}

		// console.log(`algo '${ALGO[mine[i].algo]}' Profit: ${numeral((unpaid / hour) * 24).format('0.00000000')} BTC/Day`)
		graph.amount = max
		let daily = `${numeral(graph.amount * graph.exchange).format('0,0.00')} THB`
		let monthly = `${numeral((graph.amount * 30) * graph.exchange).format('0,0.00')} THB`
		term.green.bold.moveTo((term.width / 2) + 9, 4, daily)
		term.green.bold.moveTo((term.width / 2) + 9, 5, monthly)
		term.moveTo((term.width / 2) + 10 + daily.length, 4, `(${numeral(graph.amount).format('0.00000000')} BTC)`)
		term.moveTo((term.width / 2) + 10 + monthly.length, 5, `(${numeral(graph.amount * 30).format('0.00000000')} BTC)`)
	} else {
		throw res.result.error
	}
}).catch(err => {
	// term.red.bold.moveTo(2, 18, err.message || err)
  graph.error += 1
});

let exchange = () => request({
	url: `https://blockchain.info/th/ticker`,
	json: true
}).then(res => {
	graph.exchange = res['THB'].sell
	let exchange = `${numeral(graph.exchange).format('0,0.00')} THB`
	term.blue.bold.moveTo(12,4, exchange)
	term.moveTo(26,4, `(1 BTC)`)
	// console.log(`${res['THB'].sell} ${res['THB'].symbol}`)
}).catch((err) => {
  graph.error += 1
});

let unpaid = () => request({
	url: `https://api.nicehash.com/api?method=stats.provider&addr=${wallet}`,
	json: true
}).then(res => {
	graph.unpaid = 0.0 
	graph.algo = []
	res.result.stats.forEach(item => {
		graph.unpaid += parseFloat(item.balance)
		if (parseFloat(item.accepted_speed) > 0.0) {
			graph.algo.push({
				algo: ALGO[item.algo],
				unpaid: numeral(item.balance).format('0.00000000')
			})
		}


	})

	if (res.result.payments.length > 0 && graph.payment != res.result.payments[0].time) {
		graph.payment = res.result.payments[0].time
		balance(true)
	}


	let unpaid = `${numeral(graph.unpaid * graph.exchange).format('0,0.00')} THB `
	term.green.bold.moveTo(57,7, unpaid)
	term.moveTo(57 + unpaid.length, 7, `(${numeral(graph.unpaid).format('0.00000000')} BTC)`)

}).catch((err) => {
  graph.error += 1
});

let balance = (check) => request({
	url: `https://api.nicehash.com/api?method=balance&id=${apiId}&key=${apiKey}`,
	json: true
}).then(res => {

	graph.balance = res.result.balance_confirmed

	if (!check) {
		const client = new line.Client({ channelAccessToken: access_token });
		let msg = `Balance ${numeral(graph.balance * graph.exchange).format('0,0.00')} THB (${graph.balance} BTC)`
		client.pushMessage(msgID, { type: 'text', text: msg }).catch((err) => {
		  graph.error += 1
		})
	}
	
	let balance = `${numeral(graph.balance * graph.exchange).format('0,0.00')} THB `
	term.green.bold.moveTo(12,5, balance)
	term.moveTo(12 + balance.length, 5, `(${numeral(graph.balance).format('0.00000000')} BTC)`)

}).catch((err) => {
  graph.error += 1
});


let getMessageDaily = () => {
	try {
		const client = new line.Client({ channelAccessToken: access_token })

		let sender = {
			type: 'template',
			altText: `Geforce GTX1080 TI Rig stats`,
			template: {
				type: 'buttons',
				title: `GTX1080 TI x${graph.gpu.length} Rig`,
				text: `Daily income ${numeral(graph.amount * graph.exchange).format('0,0.00')} Baht
Monthly income ${numeral((graph.amount * 30) * graph.exchange).format('0,0.00')} Baht`,
				thumbnailImageUrl: 'https://image.ibb.co/i4dHRk/1080ti_2b_1.jpg',
				actions: [
					{ type: 'message', label: `UNPAID ${numeral(graph.unpaid * graph.exchange).format('0,0.00')} Baht`, text: numeral(graph.unpaid * graph.exchange).format('0,0.00') },
					{ type: 'message', label: `Exchange rate`, text: numeral(graph.exchange).format('0,0.00') }
				]
			}
		}

		// let unpaid = `You will be paid about ${numeral(graph.unpaid * graph.exchange).format('0,0.00')} THB`
		// client.pushMessage(msgID, { type: 'text', text: unpaid })
		client.pushMessage(msgID, sender).then(() => {

		}).catch((err) => {
		  graph.error += 1
		})
	} catch (ex) {
	  graph.error += 1
	}
}
let last_unpaid = 0.0
let getMessagePaid = () => {
	try {
		const client = new line.Client({ channelAccessToken: access_token })
		let money = (graph.unpaid - last_unpaid) * graph.exchange
		if (last_unpaid > graph.unpaid) money = graph.unpaid * graph.exchange
		if (money > 0.0) {
			let unpaid = `You get paid +${numeral(money).format('0,0.00')} Baht.`
			last_unpaid = graph.unpaid
			client.pushMessage(msgID, { type: 'text', text: unpaid }).catch((err) => {
			  graph.error += 1
			})
		}

	} catch (ex) {
	  graph.error += 1
	}
}

let colorTemp = temp => (temp >= 80 ? (temp >= 90 ? temp : temp) : temp);
let colorPower = temp => (temp >= 220 ? (temp >= 250 ? temp : temp) : temp);
let normalization = (gpu, i) => {
	if (gpu.temp < min) min = gpu.temp
	if (gpu.temp > max) max = gpu.temp

		// Power: ${!gpu.power ? ('N\\A') : colorPower(gpu.power)} W Speed: ${!gpu.fan ? ('N\\A') : gpu.fan}
	let name = `- GPU#${gpu.index} ${gpu.name} ${parseInt(gpu.memory.total / 1024)}GB --- GPU: `
	let mem = `${(gpu.memory.used * 100 / gpu.memory.total).toFixed(1)} %`
	let temp = `${gpu.temp}°C`
	term.bold.moveTo(2, 8+i , `${name}  `)
	term.bold.cyan.moveTo(2 + name.length, 8+i, `${gpu.ugpu}  `)
	term.bold.moveTo(3 + name.length + gpu.ugpu.length, 8+i, `Memory: `)
	term.bold.cyan.moveTo(11 + name.length + gpu.ugpu.length, 8+i, `${mem}  `)
	term.bold.moveTo(12 + name.length + gpu.ugpu.length + mem.length, 8+i, `Temperature: `)

	let t_x = 25 + name.length + gpu.ugpu.length + mem.length
	if (gpu.temp >= 250) {
		term.bold.red.moveTo(t_x, 8+i, `${temp}  `)
	} else if (gpu.temp >= 200) {
		term.bold.yellow.moveTo(t_x, 8+i, `${temp}  `)
	} else {	
		term.bold.cyan.moveTo(t_x, 8+i, `${temp}  `)
	}
	
	term.bold.moveTo(26 + name.length + gpu.ugpu.length + mem.length + temp.length, 8+i, `Power: `)
	if (!gpu.power) gpu.power = 'N/A'; else gpu.power += ` W     `;

	let p_x = 33 + name.length + gpu.ugpu.length + mem.length + temp.length
	if (gpu.power >= 250) {
		term.bold.red.moveTo(p_x, 8+i, gpu.power)
	} else if (gpu.power >= 200) {
		term.bold.yellow.moveTo(p_x, 8+i, gpu.power)
	} else {	
		term.bold.cyan.moveTo(p_x, 8+i, gpu.power)
	}

  if ((gpu.temp >= 85 || gpu.temp < 60) && !isOverheat) {
  	let slack_text = `[${moment().format('HH:MM:ss')}] *GPU#${gpu.index}:* \`${gpu.ugpu}\` TEMP: \`${gpu.temp}°C\` POWER: \`${!gpu.power ? 'N\\A' : `${numeral(gpu.power).format(0)} W`}\``
  	let line_text = `${gpu.index}#${gpu.name}
GPU: ${gpu.ugpu} Temperature: ${gpu.temp}°C P: ${!gpu.power ? 'N\\A' : `${numeral(gpu.power).format(0)} W`}`
		slack.hook(`${(process.argv[2] ? `[${process.argv[2]}]` : '')}`, slack_text)

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

	let header = `  Computer Name: ${os.hostname()} [${process.argv[2]}]  `
	term.bold.white.bgGreen.moveTo((term.width / 2) - (header.length / 2),2, header)

	term.moveTo(2,4, `Exchange:`)
	term.blue.bold.moveTo(12,4, `0.00 THB`)

	term.moveTo((term.width / 2) + 2,4, `Daily:`)
	term.green.bold.moveTo((term.width / 2) + 9,4, `0.00 THB`)

	term.moveTo((term.width / 2),5, `Monthly:`)
	term.green.bold.moveTo((term.width / 2) + 9,5, `0.00 THB`)

	term.moveTo(3,5, `Balance:`)
	term.green.bold.moveTo(12,5, `0.00 THB`)

	term.moveTo(2,7, `List GPU update at `)

	term.moveTo(47,7, `| unpaid:`)
	term.green.bold.moveTo(57,7, `0.00 THB`)

	term.moveTo(2,16, `List Algorithm updated.`)
	setInterval(() => {
		term.yellow.bold.moveTo(21,7, graph.update.format('DD MMMM YYYY HH:mm:ss.SSS'))
		term.red.bold.moveTo(5,6, `ERROR:`)
		term.red.bold.moveTo(12,6, graph.error ? graph.error : 'N/A')

		graph.gpu.forEach((item, i) => {
			normalization(item, i)
		})
		graph.algo.forEach((item, i) => {
			term.blue.bold.moveTo(2, 17+i, `- algo '${item.algo}' unpaid: ${item.unpaid} BTC`)
		})
		term.white('\n')
	}, 1000)
	term.white('')
	term.hideCursor()
	exchange().then(() => {
		return unpaid()
	}).then(() => {
		return provider()
	})
	

	// Get Unpaid balance
	new cron.CronJob({
	  cronTime: '00 * * * *',
	  onTick: () => {
	  	unpaid().then(() => provider()).then(() => getMessagePaid())
	  },
	  start: true,
	  timeZone: 'Asia/Bangkok'
	});

	// Get Unpaid balance
	new cron.CronJob({
	  cronTime: '45 16 * * *',
	  onTick: getMessageDaily,
	  start: true,
	  timeZone: 'Asia/Bangkok'
	});

	// Get Unpaid balance
	new cron.CronJob({
	  cronTime: '00 19 * * *',
	  onTick: balance,
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