const os 			= require('os')
const request = require('request-promise')
const moment 	= require('moment')
const numeral = require('numeral')
const r 			= require('rethinkdb')
const cron 		= require('cron')

const wallet = '35mEEbAGuuz7xpXZMZhhwgWYnkgtTXL4Qc'

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
			if ((unpaid / hour) * 24 > max) max = (unpaid / hour) * 24
			console.log(`algo '${ALGO[mine[i].algo]}' Profit: ${numeral().format('0.00000000')} BTC/Day`)
		}
	} else {
		throw res.result.error
	}
}).catch(err => {
	console.log('stats.provider.ex ::', err.message || err)
});

provider()