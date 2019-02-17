const express = require('express')
const cors = require('cors')

const wifiboxContract = require('./DMTWiFiBoxContract.js')

wifiboxContract.init()

async function startIoTservice () {
  let ret = {}
  await wifiboxContract.isReady().then(async function (r) {
    ret = r 
  })
  if (!ret.status) return ret
  
  await wifiboxContract.getContractRead().then(r => {
    ret = r
    if (!r.status) console.log('contractRead ready')
  })
  if (!ret.status) return ret

  await wifiboxContract.getAccount().then(r => {
    ret = r
    if (!r.status) console.log('use account', ret.account)
  })
  return ret
}

// start web service for offline detector
const app = express()
app.use(cors())
app.listen(3000)

app.get('/', function (req, res) {
  let ret = {status: true, title:"IoTservice", usage:
    "/ipaddr get ip address\n"
    + "/setup/:owneraddress/:privatekey setup with owner wallet address and private key for this Pi\n"
    + "/offline/:ipaddr for offline detection agent to nitify IoTservice that user on this ip address is offline now\n"
  }
  res.send(JSON.stringify(ret))
})

app.get('/ipaddr', function(req, res) {
  let ret = {status: true, ipaddr: req.connection.remoteAddress}
  res.send(JSON.stringify(ret))
})

app.get('/setup/:owneraddress/:privatekey', async function(req, res) {
  let piwallet = false
  await wifiboxContract.setup(req.params.owneraddress, req.params.privatekey).then(r => {
    console.log('setup', r)
    piwallet = r
  })
  let ret = {status: false}
  if (piwallet) {
    await startIoTservice().then(r => {
      ret = r
    })
  }
  res.send(JSON.stringify(ret))
})

app.get('/offline/:ipaddr', async function(req, res) {
  let ret = {status: false}
  if (req.connection.remoteAddress !== '127.0.0.1' && req.connection.remoteAddress !== '::ffff:127.0.0.1') {
      ret.error = 'localhost only, your ip is ' + req.connection.remoteAddress 
    res.send(JSON.stringify(ret))
    return
  }
  await wifiboxContract.isReady().then(r => {
    ret = r
  })
  if (ret.status) {
    await wifiboxContract.offline(req.params.ip).then(r => {
      ret = r
    })
  }
  res.send(JSON.stringify(ret))
})

