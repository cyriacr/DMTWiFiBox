# DMT Wi-Fi Box

## Project setup
```
npm install
```
### Start up dexon ganache
Copy secret-sample.js to secret.js, and replace with your mnemonic 12 words.
```
npm run rpc
```

### Compiles contracts

```
npm run compile
```

### Deploy to localhost
```
npm run migrate:dev
```

### Deploy to testnet
```
npm run migrate:testnet
```

### Compiles and hot-reloads for development
```
npm run serve
```

### IoTservice API explains
```
# usage
curl http://127.0.0.1:3000/
#
# returns {status: true, usage: 'usage text...'}

# get your ip address and Pi's wallet address
curl http://127.0.0.1:3000/ipaddr
#
# returns {status:true|false,ipaddr: 'your ip address', piaddr: 'wallet address of Pi'}

# Pi setup with owner's wallet address, and a different private key for Pi
curl http://127.0.0.1:3000/setup/:ownerWallet/:piPrivateKey
#
# returns {status:true|false, error: 'error message if any'}

# notify IoTservice to call userOffline function
curl http://127.0.0.1:3000/offline/:ipaddr
#
# returns {status: true|false, error: 'error message if any'}
```

### *for developer* start IoTservice for localhost
Copy settings.json.example to settings.json

```
npm run iotservice:dev
```

### *for developer* start IotService for testnet
```
npm run iotservice:testnet
```

### start IoTService on Pi
copy nodejs/ to Pi
```
npm install
node IoTservice.js
```
