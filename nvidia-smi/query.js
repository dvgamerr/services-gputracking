const moment = require('moment')

class Query {
  constructor (query, raw) {
    let obj = raw.split(', ')
    let isLost = id => obj[query.indexOf(id)] === '[GPU is lost]'
    let parse = id => {
      let value = obj[query.indexOf(id)]
      return value === '[Not Supported]' || value === '[GPU is lost]' ? null : value
    }
    let getInt = value => value ? parseInt(/\d+/ig.exec(value)[0] || '0') : 0
    this.index = getInt(parse('index'))
    this.uuid = parse('uuid')
    this.name = parse('name')
    this.alive = false
    if (!isLost('temperature.gpu') && !isLost('power.draw') && !isLost('fan.speed')) {
      this.alive = true
      this.state = parse('pstate')
      this.date = moment(parse('timestamp'), 'YYYY/MM/DD hh:mm:ss.SSS')
      this.bus_id = parse('pci.bus_id')
      this.temp = getInt(parse('temperature.gpu'))
      this.ugpu = getInt(parse('utilization.gpu'))
      this.umemory = getInt(parse('utilization.memory'))
      this.power = {
        draw: parse('power.draw'),
        limit: parse('power.limit')
      }

      this.clocks = parse('clocks.mem')
      this.fan = getInt(parse('fan.speed'))
      this.memory = {
        total: parse('memory.total'),
        free: parse('memory.free'),
        used: parse('memory.used')
      }
    }
  }
}

module.exports = Query
