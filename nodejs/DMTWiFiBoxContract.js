const Web3 = require('web3')
const fs = require('fs')
const DMTWiFiBox = require('./contracts/DMTWiFiBox.json')
const { exec } = require('child_process')

// select network
var args = process.argv.slice(2)
const network = (typeof args[0] !== 'undefined' ? args[0] : 'dexonTestnet')
const netid = (network === 'development' ? 5777 : 238)
const WS_PROVIDER = () => {
  return (netid === 5777)
    ? 'ws://127.0.0.1:8545'
    : 'wss://ws-proxy.dexon.org'
}
console.log('network', network, 'netid', netid)

const writeFile = (path, data, opts = 'utf8') =>
new Promise((resolve, reject) => {
  fs.writeFile(path, data, opts, (err) => {
    if (err) reject(err)
    else resolve()
  })
})

// class
module.exports = {
  // wallet hanlder
  walletHandler: null,

  // contract read/write streams
  contractRead: null,
  contractWrite: null,

  // default gas fee 3M, adjust it after testing
  gasFee: 3000000,

  // pi info
  pi: {},

  // iplist
  iplist: {},

  // settings
  settings: {},

  init: function () {
    this.settings = JSON.parse(fs.readFileSync('settings.json', 'utf8'))
  },

  setup: async function (owner, privatekey) {
    let ret = {status: false }
    if (owner == '' || privatekey == '') {
      ret.error = 'incorrect settings'
      return ret
    }
    let r = await this.isReady()
    if (!r.status) {
      this.settings.owner = owner
    }
    if (this.settings.owner !== owner) {
      ret = {status: false, error: 'not owner' }
      return ret
    }
    this.settings.privatekey = privatekey
    let json = JSON.stringify(this.settings)
    try {
      await writeFile('settings.json', json, 'utf8')
    } catch (error) {
      ret = {status: false, error: error}
    }
    return ret
  },

  isReady: async function () {
    if (this.settings.privatekey === '') return {status: false, error: 'please setup this Pi first'}
    let ret = {status: false}
    if (this.contractWrite) {
      return {status: true}
    }
    await this.getContractWrite().then(r => {
      ret = r
    })
    return ret
  },


  // get current pi wallet address
  getAccount: async function () {
    await this.walletHandler.eth.getAccounts().then(accounts => {
      if (accounts.length === 0) {
        console.log('error, no accounts')
        return {status: false, error: 'no accounts'}
      }
      this.walletHandler.eth.defaultAccount = accounts[0]
      this.pi.addr = accounts[0]
    })
    return {status: true, account: this.pi.addr}
  },

  // get contract write stream
  getContractWrite: async function () {
    try {
      let HTTP_PROVIDER = new HDWalletProvider(this.settings.privatekey, netid == 238 ? 'http://testnet.dexon.org:8545' : 'http://127.0.0.1:8545')
      this.walletHandler = await new Web3(HTTP_PROVIDER)
      this.contractWrite = await new this.walletHandler.eth.Contract(DMTWiFiBox.abi, DMTWiFiBox.networks[netid].address)  
    } catch (error) {
      return {status: false, error: 'incorrect settings', web3error: error}
    }
    return {status: true}
  },

  // get contract read stream and setup event listeners
  getContractRead: async function () {
    try {
      this.handlerRead = new Web3(WS_PROVIDER())
      this.contractRead = await new this.handlerRead.eth.Contract(DMTWiFiBox.abi, DMTWiFiBox.networks[netid].address)  
      this.contractRead.events.allEvents({}, function (error, event) {
        if (error) {
          console.log('event error', error, event)
          return
        }
        switch (event.event) {
          case 'online':
            // event online(address indexed from, address indexed pi, uint ipaddr, uint maxtime);
            // only handle events related with current Pi
            if (event.returnValues.pi !== this.pi.addr) break
            // execute shell to change iptables rules
            let cmd = "ndsctl auth " + event.returnValues.ipaddr 
            exec(cmd, (err, stdout, stderr) => {
              if (err) {
                // node couldn't execute the command
                return
              }
            
              // the *entire* stdout and stderr (buffered)
              console.log(`stdout: ${stdout}`)
              console.log(`stderr: ${stderr}`)
            })
            that.iplist[event.returnValues.ipaddr] = event.returnValues.from
            console.log('online', event.returnValues)
            break
          case 'offline':
            // event offline(address indexed from, address pi);
            // only handle events related with current Pi
            if (event.returnValues.pi !== this.pi.addr) break
            console.log('offline', event.returnValues)
            break
          default:
            console.log('event', event.event)
        }      
      })
    } catch(error) {
      return {status: false, error: error}
    }
    return {status: true}
  },
  // expose offline function to Pi
  offline: async function (useraddr) {
    try {
      await this.contractWrite.methods.userOffline(useraddr).send({ from: this.pi.addr, gas: this.gasFee })
    } catch (error) {
      // error.reason now populated with an REVERT reason
      console.log('Failure reason', error.reason)
      console.log(error)
      return {status: false, error: error}
    }
    return {status: true}
  }
}
