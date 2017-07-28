// C:\Program Files\NVIDIA Corporation\NVSMI\nvidia-smi.exe
const clear 	= require("clear")
const chalk 	= require('chalk')
const os 			= require('os')
const moment 	= require('moment')
const r 			= require('rethinkdb')

r.connect({ host: 'aws.touno.co', port: 6511 }, (err, conn) => {
	r.db('miner').table('gpu_stats').run(conn, (err, cursor) => {
		cursor.each((err, data) => {
			console.log(data)
		})
	})
})


