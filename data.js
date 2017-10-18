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

// const nvidia 	= require('./nvidia-smi')
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
	gpu: []
}
// 
let exchange = () => request({
	url: `https://blockchain.info/th/ticker`,
	json: true
}).then(res => {
	graph.exchange = res['THB'].sell
	let exchange = `${numeral(graph.exchange).format('0,0.00')} THB`
	// term.blue.bold.moveTo(12,4, exchange)
	console.log(`(1 BTC)`)
	// console.log(`${res['THB'].sell} ${res['THB'].symbol}`)
}).catch((err) => {
  graph.error += 1
});

let exchange_coins = () => request({
	url: `https://quote.coins.ph/v1/markets/BTC-THB`,
	json: true
}).then(res => {
	graph.exchange = res.market.bid
	// let exchange = `${numeral(graph.exchange).format('0,0.00')} THB`
	// term.blue.bold.moveTo(12,4, exchange)
	// console.log(`(1 BTC)`)
	console.log(`${res.market.bid}`)
}).catch((err) => {
  graph.error += 1
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
	let last = null
	graph.days = 0
	res.result.payments.forEach(item => {
		graph.amount += parseFloat(item.amount)
		if (last) graph.days += (last.diff(moment(item.time).hour(0).minutes(0).seconds(0)) / 86400000)
		last = moment(item.time).hour(0).minutes(0).seconds(0)
	})
	graph.amount = graph.amount / graph.days
	console.log('payment:', graph.days, 'days')
	if (res.result.payments.length > 0 && graph.payment != res.result.payments[0].time) {
		graph.payment = res.result.payments[0].time
		balance()
	}


	let daily = `${numeral(graph.amount * graph.exchange).format('0,0.00')} THB`
	let monthly = `${numeral((graph.amount * 30) * graph.exchange).format('0,0.00')} THB`
	console.log('Daily:', daily, `(${numeral(graph.amount).format('0.00000000')} BTC)`)
	console.log('Monthly:', monthly, `(${numeral(graph.amount * 30).format('0.00000000')} BTC)`)

	let unpaid = `${numeral(graph.unpaid * graph.exchange).format('0,0.00')} THB `
	console.log('Unpaid:', unpaid, `(${numeral(graph.unpaid).format('0.00000000')} BTC)`)
}).catch((err) => {
  graph.error += 1
});

let balance = () => request({
	url: `https://api.nicehash.com/api?method=balance&id=195158&key=c81830fc-2f6b-4f60-b6dc-cca004113809`,
	json: true
}).then(res => {
	graph.balance = res.result.balance_confirmed
	let msg = `Balance ${numeral(graph.balance * graph.exchange).format('0,0.00')} THB (${graph.balance} BTC)`
	// client.pushMessage('U99a557887fe970d1e51dcef21f2fc278', { type: 'text', text: msg }).catch((err) => {
	//   graph.error += 1
	// });
	
	let balance = `${numeral(graph.balance * graph.exchange).format('0,0.00')} THB `
	console.log('Balance:', balance, `(${numeral(graph.balance).format('0.00000000')} BTC)`)

}).catch((err) => {
  graph.error += 1
});

let getMessage = () => {
	let unpaid = `You will be paid about ${numeral(graph.unpaid * graph.exchange).format('0,0.00')} THB
${numeral(graph.unpaid).format('0.00000000')} BTC`
	let daily = `Daily income ${numeral(graph.amount * graph.exchange).format('0,0.00')} THB
${numeral(graph.amount).format('0.00000000')} BTC`
	let monthly = `Monthly income ${numeral((graph.amount * 30) * graph.exchange).format('0,0.00')} THB 
${numeral(graph.amount * 30).format('0.00000000')} BTC`
	let exchange = `Exchange rate BTC is ${numeral(graph.exchange).format('0,0.00')} THB)`

	let msg = `${daily}
${monthly}
${exchange}`
	console.log(msg)

}
exchange_coins().then(()=> {
	return unpaid()
})