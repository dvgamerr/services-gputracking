const { debug } = require('touno.io').Variable
const { Raven } = require('touno.io')
const { LINE } = require('touno.io').Notify
const { MongooseOpen, MongooseClose, Miner } = require('touno.io/mongodb')
const { r, rdbConnection } = require('touno.io/rethinkdb')
const cron = require('cron')
const os = require('os')
const util = require('util')
const nvsmi = require('./nvidia-smi')
const exec = util.promisify(require('child_process').exec)
let GPU_MAX = process.env.GPU_MAX || 1
let IsShutdown = false
let GPU = []

console.log(`[GPU] RethinkDB Connecting...`)
rdbConnection().then(async conn => {
  console.log(`[GPU] MongoDB Connecting...`)
  await MongooseOpen({ user: 'admin', pass: 'ar00t-touno', dbname: 'db_touno' })
  let wait = 10
  let sendRestart = async () => {
    const { stderr } = await exec(`shutdown -r -t ${wait}`)
    if (stderr) throw new Error(stderr)
  }

  let gpuUploadData = async (i, smi) => {
    if (IsShutdown) process.exit(0)
    if (smi.alive) {
      if (!GPU[i]) {
        console.log(`[GPU] Processing ${smi.index}:${smi.name} ${smi.bus_id}.`)
        GPU[i] = {
          gpu_id: smi.uuid,
          index: smi.index,
          name: smi.name,
          compute: os.hostname(),
          state: smi.state,
          bus_id: smi.bus_id,
          updated: smi.date
        }
        if (await Miner.findOne({ gpu_id: smi.uuid })) {
          await Miner.update({ gpu_id: smi.uuid }, { $set: { updated: GPU[i].updated } })
        } else {
          await new Miner(GPU[i]).save()
        }
      } else if (smi.date - GPU[i].updated > 60000 * 3) {
        GPU[i].updated = smi.date
        await Miner.update({ gpu_id: smi.uuid }, { $set: { updated: GPU[i].updated } })
      }

      let result = await r.db('miner').table('gpu_01').insert({
        gpu_id: smi.uuid,
        created: smi.date,
        temp: smi.temp,
        ugpu: smi.ugpu,
        umemory: smi.umemory,
        power: smi.power,
        clocks: smi.clocks,
        fan: smi.fan,
        memory: smi.memory
      }).run(conn)
      if (!result.inserted) throw new Error(`gputracking cant't inserted data.`)
    } else {
      if (!IsShutdown) {
        LINE.Miner(`การ์ดจอ ${smi.index}:${smi.name} ดับ\nบนเครื่อง ${os.hostname()} ซึ่งกำลังรีสตาร์ทใน ${wait} วินาที.`)
        if (!debug) await sendRestart()
        await MongooseClose()
        await conn.close()
      }
      IsShutdown = true
    }
  }

  nvsmi.on('error', ex => { Raven(ex) })

  console.log(`[GPU] ${os.hostname()} nvidia-smi processing ${GPU_MAX} card.`)
  for (let i = 0; i < GPU_MAX; i++) {
    nvsmi.emit('gpu', { id: i, interval: 1 }, smi => {
      gpuUploadData(i, smi).catch(ex => {
        Raven(ex)
        process.exit(0)
      })
    })
  }

  let job = new cron.CronJob({
    cronTime: '0 0 * * *',
    onTick: async () => {
      let result = await r.db('miner').table('gpu_01').filter(item => {
        return r.now().sub(item('created')).gt(60 * 60 * 24 * 30)
      }).delete().run(conn)
      console.log(`[GPU] RethinkDB remove ${result.deleted} colletion.`)
    },
    start: true,
    timeZone: 'Asia/Bangkok'
  })
  console.log(`[GPU] Purge data Tasks ${job.running ? 'started' : 'stoped'}`)
}).catch(ex => {
  Raven(ex)
  process.exit(0)
})
