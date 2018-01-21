const request = require('request-promise')
const moment = require('moment')
const numeral = require('numeral')
const rdb = require('rethinkdb')


let main = async () => {
  let data = await request({
    url: `http://192.168.1.3:8085/data.json`,
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
  console.log(miner)
  console.log('----------------------------------------------------')
}

setInterval(() => {
  main().then(() => {

  }).catch(ex => {
    console.log(ex.message || ex)
  })
}, 1000)
// r.connect({ host: 'aws.touno.co', port: 6511 }, function(err, conn) {
// r.connect({ host: 'localhost', port: 28015 }, function(err, conn) {
// 	conn.use('miner')
// 	nvidia.watch({ interval: 1 })
// 	nvidia.on('gpu', gpu => {
//     r.table('gpu_stats').insert({ 
//     	miner: process.argv[2], gpu: {
// 	     index: gpu.index,
// 	     date: gpu.date.toDate(),
// 	     name: gpu.name,
// 	     device: gpu.device,
// 	     bus: gpu.bus,
// 	     domain: gpu.domain,
// 	     temp: gpu.temp,
// 	     ugpu: gpu.ugpu,
// 	     umemory: gpu.umemory,
// 	     power: gpu.power,
// 	     clocks: gpu.clocks,
// 	     fan: gpu.fan,
// 	     memory: gpu.memory
//     	} 
//   	}).run(conn)
// 		graph.update = gpu.date
// 		graph.gpu[gpu.index] = gpu
// 	});
//  })
