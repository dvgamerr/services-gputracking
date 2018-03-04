const { Raven } = require('touno.io')
const fs = require('fs')
const os = require('os')
const Query = require('./query')
const { EventEmitter } = require('events')
const spawn = require('child_process').spawn

let NVSMIx64 = process.env.NVSMI || `C:/Program Files/NVIDIA Corporation/NVSMI/nvidia-smi.exe`

let gpu = [
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
  'power.limit',
  'clocks.mem',
  'fan.speed'
]

let emiter = new EventEmitter()
console.log('COMPUTER:', os.hostname())
console.log(Query)
emiter.on('watch', config => {
  config = config || {}
  let logs = ''
  if (fs.existsSync(`${NVSMIx64}`)) {
    let ls = spawn('cmd.exe', ['/c', NVSMIx64, `--query-gpu=${gpu.join(',')}`, `--format=csv,noheader`, `-l`, `${config.interval || 1}`])

    ls.stdout.on('data', data => {
      logs += data
      if (/\r\n/ig.test(logs)) {
        let smi = new Query(gpu, /(.*?)\r\n/ig.exec(logs)[1])
        console.log(smi)
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
