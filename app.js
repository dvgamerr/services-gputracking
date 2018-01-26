const request = require('request-promise')
const cron = require('cron')
// const moment = require('moment')
// const numeral = require('numeral')
const rdb = require('rethinkdb')

const dbConnection = () => {
  let connection = {
    host: process.env.RETHINKDB_HOST,
    port: process.env.RETHINKDB_PORT,
    db: 'miner'
  }
  return new Promise((resolve, reject) => {
    rdb.connect(connection, (err, conn) => {
      if (err) reject(err); else resolve(conn)
    })
  })
}

const dbInsert = (conn, table, data) => {
  return new Promise((resolve, reject) => {
    rdb.table(table).insert(data).run(conn, (err, result) => {
      if (err) reject(err); else resolve(result)
    })
  })
}

const dbDelete = (conn, table, filter) => {
  return new Promise((resolve, reject) => {
    rdb.table(table).filter(filter).delete().run(conn, (err, result) => {
      if (err) reject(err); else resolve(result)
    })
  })
}

if (!process.env.RETHINKDB_HOST) throw new Error(`Required 'RETHINKDB_HOST' environment.`)
if (!process.env.RETHINKDB_PORT) throw new Error(`Required 'RETHINKDB_PORT' environment.`)

let main = async (conn) => {
  let data = await request({
    url: `http://${process.env.MONITOR_HOST ? process.env.MONITOR_HOST : '127.0.0.1'}${process.env.MONITOR_PORT ? `:${process.env.MONITOR_PORT}` : ':8085'}/data.json`,
    json: true
  })
  let miner = {
    name: data.Children[0].Text,
    created: new Date(),
    device: []
  }
  let items = data.Children[0].Children
  for (let i = 0; i < items.length; i++) {
    if (items[i].Text.indexOf('NVIDIA') > -1) {
      let device = {
        name: items[i].Text
      }
      for (let l = 0; l < items[i].Children.length; l++) {
        let gpu = items[i].Children[l]
        if (gpu.Text === 'Temperatures') {
          device.temperature = (gpu.Children || [{}])[0].Value
        } else if (gpu.Text === 'Fans') {
          device.fan = (gpu.Children || [{}])[0].Value
        } else if (gpu.Text === 'Controls') {
          device.control = (gpu.Children || [{}])[0].Value
        } else if (gpu.Text === 'Load') {
          device.load = (gpu.Children || [{}])[0].Value
        }
      }
      miner.device.push(device)
    }
  }
  await dbInsert(conn, 'gpu', miner)
}

console.log(`[hardware-monitor] Started`)
setInterval(async () => {
  let conn = await dbConnection()
  main(conn).catch(ex => {
    console.log(`[hardware-monitor] '${ex.message || ex}'`)
  })
}, 1000)

let jobDelete = new cron.CronJob({
  cronTime: '0 0 * * *',
  onTick: async () => {
    let conn = await dbConnection()
    console.log(`[hardware-monitor] delete ${jobDelete.running ? 'complated' : 'stoped'}.`)
    await dbDelete(conn, 'gpu', item => rdb.now().sub(item('created')).gt(60 * 60 * 24 * 365))
  },
  start: true,
  timeZone: 'Asia/Bangkok'
})
