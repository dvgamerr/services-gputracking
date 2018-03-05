const fs = require('fs')
const Query = require('./query')
const list = require('./query-list')
const { EventEmitter } = require('events')
const spawn = require('child_process').spawn

let NVSMIx64 = process.env.NVSMI || `C:/Program Files/NVIDIA Corporation/NVSMI/nvidia-smi.exe`

let emiter = new EventEmitter()
emiter.on('gpu', (config, watcher) => {
  config = config || {}
  let logs = ''
  if (fs.existsSync(`${NVSMIx64}`)) {
    let params = ['/c', NVSMIx64, `--query-gpu=${list.join(',')}`, `--format=csv,noheader`]
    if (config.id > -1) {
      params.push('-i')
      params.push(config.id)
    }
    if (config.interval) {
      params.push('-l')
      params.push(config.interval)
    }

    let ls = spawn('cmd.exe', params)
    ls.stdout.on('data', data => {
      try {
        logs += data
        if (/\r\n/ig.test(logs)) {
          let csv = /(.*?)\r\n/ig.exec(logs)
          if (csv[1] === 'No devices were found') {
            emiter.emit('error', `${config.id}: ${csv[1]}`)
          } else {
            let smi = new Query(list, csv[1])
            watcher(smi)
          }
          logs = logs.substring(logs.indexOf('\r\n') + 2)
        }
      } catch (ex) {
        emiter.emit('error', ex)
      }
    })

    ls.stderr.on('data', data => {
      emiter.emit('error', new Error(data.toString()))
    })
  } else {
    emiter.emit('error', new Error(`Please install nvidia driver and check 'nvidia-smi.exe'.`))
  }
})

module.exports = emiter
