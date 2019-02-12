
const wifiboxContract = require('./DMTWiFiBoxContract.js')
try {
  wifiboxContract.getContractRead().then(() => {
    console.log('contractRead ready')
    wifiboxContract.getContractWrite().then(() => {
      console.log('contractWrite ready')
      wifiboxContract.getAccounts().then(ac => {
        console.log('use account', ac)
        setInterval(() => {
          // check if any user offline now
          // if (useroffline_signal) {
          //   let userwalletaddr = ?
          //   wifiboxContract.offline(userwalletaddr)
          // }
        }, 1000)
      })
    })
  })

} catch (e) {
  console.log('error', e)
}
