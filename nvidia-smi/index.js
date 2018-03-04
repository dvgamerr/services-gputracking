const { Raven } = require('touno.io')
const fs = require('fs')
const os = require('os')
const gpuInfo = require('gpu-info')
// const moment = require('moment')
const { EventEmitter } = require('events')
const spawn = require('child_process').spawn

let NVSMIx64 = process.env.NVSMI || `C:/Program Files/NVIDIA Corporation/NVSMI/nvidia-smi.exe`

let query = [
  'index',
  'timestamp',
  'uuid',
  'pstate',
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

// let smi = data => {
//   // 2017/07/24 10:46:40.840, GeForce 940MX, 0000:01:00.0, 39, 0 %, 0 %, 2048 MiB, 2021 MiB, 27 MiB
//   let obj = /(\d{1,2}),.([\d:\.\/ ]+),.(.+?),.([\d:\.]+),.(\d+?),.([\d %]+?),.([\d %]+?),.([\d]+).MiB,.([\d]+.)MiB,.([\d]+).MiB,.(.+?),.(.+?)MHz,.(.+)/ig.exec(data)
//   // domain:bus:device.function
//   let vender = /(\d{4}):(\d{2}):(\d{2}).(\d)/ig.exec(obj[4])
//   this.index = parseInt(obj[1])
//   this.date = moment(obj[2], 'YYYY/MM/DD hh:mm:ss.SSS') // 2017/07/24 12:18:41.852
//   this.name = obj[3]

//   this.device = parseInt(vender[3])
//   this.bus = vender[2]
//   this.domain = vender[1]

//   this.temp = parseInt(obj[5])
//   this.ugpu = obj[6]
//   this.umemory = obj[7]
//   this.power = obj[11] === '[Not Supported]' ? null : parseFloat(obj[11])
//   this.clocks = parseInt(obj[12])
//   this.fan = obj[13] === '[Not Supported]' ? null : obj[13]
//   this.memory = {
//     total: parseInt(obj[8]),
//     free: parseInt(obj[9]),
//     used: parseInt(obj[10])
//   }
// }

let emiter = new EventEmitter()
console.log('COMPUTER:', os.hostname())
gpuInfo().then(data => {
  data.forEach(row => {
    console.log(row['Name'])
  })
})

emiter.on('watch', config => {
  config = config || {}
  let logs = ''
  if (fs.existsSync(`${NVSMIx64}`)) {
    let ls = spawn('cmd.exe', ['/c', NVSMIx64, `--query-gpu=${query.join(',')}`, `--format=csv,noheader`, `-l`, `${config.interval || 1}`])

    ls.stdout.on('data', data => {
      logs += data
      if (/\r\n/ig.test(logs)) {
        let msg = /(.*?)\r\n/ig.exec(logs)[1]
        console.log(msg)
        logs = logs.substring(logs.indexOf('\r\n') + 2)
        //   emiter.emit('gpu', new smi(logs.replace('\r\n','')));
      }
    })

    ls.stderr.on('data', Raven)
    ls.on('close', (code) => Raven(new Error(`${process.argv[2]}`, `\`nvidia-smi\` child process exited with code ${code}`)))
  } else {
    Raven(new Error(`Please install nvidia driver and check 'nvidia-smi.exe'.`))
  }
})

module.exports = emiter
