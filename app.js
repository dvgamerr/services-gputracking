// C:\Program Files\NVIDIA Corporation\NVSMI\nvidia-smi.exe
const clear 	= require("clear")
const chalk 	= require('chalk')
const os 			= require('os')
const nvidia 	= require('./nvidia-smi/query')
// **GPU#0** GeForce GTX 1080 Ti 11GB - Temperature: `84 °C` Power: `245.54 W`
let colorTemp = (temp, unit) => (temp >= 80 ? (temp >= 90 ? chalk.red(temp, unit) : chalk.yellow(temp, unit)) : chalk.green(temp, unit));
let colorPower = (temp, unit) => (temp >= 220 ? (temp >= 250 ? chalk.red(temp, unit) : chalk.yellow(temp, unit)) : chalk.green(temp, unit));
let normalization = (gpu) => {
  console.log(`GPU#${gpu.index} ${gpu.name} ${parseInt(gpu.memory.total / 1024)}GB --- GPU: ${chalk.magenta(gpu.ugpu)} Memory: ${chalk.magenta((gpu.memory.used * 100 / gpu.memory.total).toFixed(1),'%')}
      Temperature: ${colorTemp(gpu.temp,'°C')} Power: ${!gpu.power ? chalk.red('[Not Supported]') : colorPower(gpu.power,'W')} Speed: ${!gpu.fan ? chalk.red('[Not Supported]') : gpu.fan}
  `)
  if (gpu.temp > 85) {
  	
  }
}

nvidia.on('gpu', gpu => {
	clear()
	console.log(`Computer Name: ${os.hostname()} ${process.argv[2] ? `[${process.argv[2]}]` : ''} (update at ${gpu.date.format('DD MMMM YYYY HH:MM:ss.SSS')})`)
	normalization(gpu)
});

nvidia.watch({ interval: 1 })