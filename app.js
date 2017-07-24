// C:\Program Files\NVIDIA Corporation\NVSMI\nvidia-smi.exe
const clear 	= require("clear")
const chalk 	= require('chalk')
const os 			= require('os')
const nvidia 	= require('./nvidia-smi/query')

let color = temp => temp >= 80 ? (temp >= 90 ? chalk.red(temp) : chalk.yellow(temp)) : chalk.green(temp);
let normalization = (gpu) => {
  console.log(`GPU#${gpu.index} ${gpu.name} ${parseInt(gpu.memory.total / 1024)}GB --- GPU: ${chalk.magenta(gpu.ugpu)} Memory: ${chalk.magenta((gpu.memory.used * 100 / gpu.memory.total).toFixed(1),'%')}
      Temperature: ${color(`${gpu.temp} °C`)} Power: ${!gpu.power ? chalk.red('[Not Supported]') : gpu.power} Speed: ${!gpu.fan ? chalk.red('[Not Supported]') : gpu.fan}
`)
}

nvidia.on('gpu', gpu => {
	clear()
	console.log(`Computer Name: ${chalk.blue(os.hostname())} [${chalk.blue(process.argv[2])}] (update at ${gpu.date.format('DD MMMM YYYY HH:MM:ss.SSS')})`)
	normalization(gpu)
});

nvidia.watch()