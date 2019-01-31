
const wifiboxContract = require('./DMTWiFiBoxContract.js')
try {
  wifiboxContract.getContractRead().then(() => {
    console.log('read')
    watch
  })

  wifiboxContract.getContractWrite().then(() => {
    console.log('write')

    wifiboxContract.getAccounts().then(ac => {
      console.log('ac', ac)
      setInterval(() => {
        // check if any user offline now
        // if (useroffline_signal) {
        //   let userwalletaddr = ?
        //   wifiboxContract.offline(userwalletaddr)
        // }
      }, 1000)
    })
  })
} catch (e) {
  console.log('error', e)
}
