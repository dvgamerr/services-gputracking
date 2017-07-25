// C:\Program Files\NVIDIA Corporation\NVSMI\nvidia-smi.exe
const clear 	= require("clear")
const chalk 	= require('chalk')
const os 			= require('os')
const moment 	= require('moment')
const nvidia 	= require('./nvidia-smi')
const slack 	= require('./slack-webhook')
// **GPU#0** GeForce GTX 1080 Ti 11GB - Temperature: `84 °C` Power: `245.54 W`
let isOverheat = false, atOverheat = null
let min = 100, max = 0

let colorTemp = (temp, unit) => (temp >= 80 ? (temp >= 90 ? chalk.red(temp, unit) : chalk.yellow(temp, unit)) : chalk.green(temp, unit));
let colorPower = (temp, unit) => (temp >= 220 ? (temp >= 250 ? chalk.red(temp, unit) : chalk.yellow(temp, unit)) : chalk.green(temp, unit));
let normalization = (gpu) => {
	if (gpu.temp < min) min = gpu.temp
	if (gpu.temp > max) max = gpu.temp
  console.log(` GPU#${gpu.index} ${gpu.name} ${parseInt(gpu.memory.total / 1024)}GB --- GPU: ${chalk.magenta(gpu.ugpu)} Memory: ${chalk.magenta((gpu.memory.used * 100 / gpu.memory.total).toFixed(1),'%')} Temperature: ${colorTemp(gpu.temp,'°C')} Power: ${!gpu.power ? chalk.red('N\\A') : colorPower(gpu.power,'W')} Speed: ${!gpu.fan ? chalk.red('N\\A') : gpu.fan}`)
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

nvidia.on('gpu', gpu => {
	clear()
	if (gpu.index == 0) console.log(`Computer Name: ${os.hostname()} ${(process.argv[2] ? `[${process.argv[2]}]` : '')} (update at ${gpu.date.format('DD MMMM YYYY HH:MM:ss.SSS')})`)
	normalization(gpu)
});

nvidia.watch({ interval: 1 })

// let r = require('rethinkdb')
// r.connect({ host: 'localhost', port: 28015 }, function(err, conn) {
//   if(err) throw err
//   console.log('RethinkDB Connected...')
//   conn.close()
//   r.db('test').tableCreate('tv_shows').run(conn, function(err, res) {
//     if(err) throw err;
//     console.log(res);
//     r.table('tv_shows').insert({ name: 'Star Trek TNG' }).run(conn, function(err, res)
//     {
//       if(err) throw err;
//       console.log(res);
//     });
//   });
// });