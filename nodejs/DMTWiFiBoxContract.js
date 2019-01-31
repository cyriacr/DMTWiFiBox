const Web3 = require('web3')
const DMTWiFiBox = require('../build/contracts/DMTWiFiBox.json')

// change to pi's wallet when pi's ready
const truffleWallet = require('../truffle-config')

// select network
var args = process.argv.slice(2)
const network = (args[0] !== '' ? args[0] : 'development')
const netid = (network === 'development' ? 5777 : 238)
const HTTP_PROVIDER = truffleWallet.networks[network].provider()
const WS_PROVIDER = () => {
  return (netid === 5777)
    ? 'ws://127.0.0.1:8545'
    : 'wss://ws-proxy.dexon.org'
}
console.log('network', network, 'netid', netid)

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

  // get current pi wallet address
  getAccounts: async function () {
    await this.walletHandler.eth.getAccounts().then(accounts => {
      if (accounts.length === 0) {
        console.log('error, no accounts')
        return false
      }
      this.walletHandler.eth.defaultAccount = accounts[0]
      this.pi.addr = accounts[0]
    })
    return this.pi.addr
  },

  // get contract write stream
  getContractWrite: async function () {
    this.walletHandler = await new Web3(HTTP_PROVIDER)
    this.contractWrite = await new this.walletHandler.eth.Contract(DMTWiFiBox.abi, DMTWiFiBox.networks[netid].address)
  },

  // get contract read stream and setup event listeners
  getContractRead: async function () {
    this.handlerRead = new Web3(WS_PROVIDER())
    this.contractRead = await new this.handlerRead.eth.Contract(DMTWiFiBox.abi, DMTWiFiBox.networks[netid].address)
    this.contractRead.events.allEvents({}, function (error, event) {
      if (error) {
        console.log('event error', error, event)
        return
      }
      switch (event.event) {
        case 'online':
          // event online(address from, address pi, uint ipaddr, uint maxtime);
          // only handle events related with current Pi
          if (pi !== this.pi.addr) break
          // execute shell to change iptables rules
          console.log('online', event.returnValues)
          break
        case 'offline':
          // event offline(address from, address pi, uint starttm, uint endtm, uint creditused);
          // only handle events related with current Pi
          if (pi !== this.pi.addr) break
          console.log('offline', event.returnValues)
          // ignore this message in Pi
          break
        default:
          console.log('event', event.event)
      }
    })
  },

  // expose offline function to Pi
  offline: async function (useraddr) {
    try {
      await this.contractWrite.methods.useroffline(useraddr).send({ from: this.pi.addr, gas: this.gasFee })
    } catch (error) {
      // error.reason now populated with an REVERT reason
      console.log('Failure reason', error.reason)
      console.log(error)
    }
  }
}
