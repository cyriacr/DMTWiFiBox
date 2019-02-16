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

### start IoTservice for localhost
Copy settings.json.example to settings.json

```
npm run iotservice:dev
```

### start IotService for testnet
```
npm run iotservice:testnet
```
