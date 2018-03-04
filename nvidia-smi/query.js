const moment = require('moment')

class Query {
  constructor (query, raw) {
    let obj = raw.split(', ')
    let parse = id => obj[query.indexOf(id)] === '[Not Supported]' ? null : obj[query.indexOf(id)]
    let getInt = value => value ? /\d+/ig.exec(value)[0] : 0

    this.index = getInt(parse('index'))
    this.uuid = parse('uuid')
    this.state = parse('pstate')
    this.date = moment(parse('timestamp'), 'YYYY/MM/DD hh:mm:ss.SSS')
    this.name = parse('name')

    let vender = /(\d{4,8}):(\d{2}):(\d{2}).(\d)/ig.exec(parse('pci.bus_id'))
    this.device = getInt(vender[3])
    this.bus = vender[2]
    this.domain = vender[1]

    this.temp = getInt(parse('temperature.gpu'))
    this.ugpu = getInt(parse('utilization.gpu'))
    this.umemory = getInt(parse('utilization.memory'))
    this.power = {
      draw: getInt(parse('power.draw')),
      limit: getInt(parse('power.limit'))
    }

    this.clocks = getInt(parse('clocks.mem'))
    this.fan = getInt(parse('fan.speed'))
    this.memory = {
      total: getInt(parse('memory.total')),
      free: getInt(parse('memory.free')),
      used: getInt(parse('memory.used'))
    }
  }
}

module.exports = Query
