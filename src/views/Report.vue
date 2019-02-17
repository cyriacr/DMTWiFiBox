<template>
  <v-content style="height:calc(100vh - 80px)">
    <v-card flat>
       <v-card-text>
          <v-layout>
          <v-flex  xs12 sm6 md3>
            <v-layout>
              <v-flex xs4>
                <v-btn @click="report">Report</v-btn>
              </v-flex>
            </v-layout>
          </v-flex>
        </v-layout>
        Online Events:
        <ul>
        <li v-for="item in onlineEvents" v-bind:value="item.blockHash" :key="item.blockHash">
            from: {{ item.returnValues[0] }} <br>
            pi: {{ item.returnValues[1] }} <br> 
            ipaddr: {{ item.returnValues[2] }} <br> 
            maxtime: {{ item.returnValues[3] }} <br>  
          </li>
        </ul>
        <hr>
        Offline Events:
        <ul>
        <li v-for="item in offlineEvents" v-bind:value="item.blockHash" :key="item.blockHash">
            from: {{ item.returnValues[0] }} <br>
            pi: {{ item.returnValues[1] }} <br> 
          </li>
        </ul>
        <hr>
        Deposit Events:
        <ul>
        <li v-for="item in depositEvents" v-bind:value="item.blockHash" :key="item.blockHash">
            from: {{ item.returnValues[0] }} <br>
            to: {{ item.returnValues[1] }} <br> 
            credit: {{ item.returnValues[2] }} <br>   
          </li>
        </ul>
        <hr>
        Deduction Events:
                <ul>
        <li v-for="item in deductionEvents" v-bind:value="item.blockHash" :key="item.blockHash">
            from: {{ item.returnValues[0] }} <br>
            owner: {{ item.returnValues[1] }} <br> 
            starttm: {{ item.returnValues[2] }} <br>   
            endtm: {{ item.returnValues[3] }} <br> 
            creditused: {{ item.returnValues[4] }} <br>  
          </li>
        </ul>
      </v-card-text>
    </v-card>
    <v-dialog
      v-model="dialog"
      persistent
      >
      <v-card
        class="white--text"
        style="background-image: radial-gradient(circle at 50% 45%, rgb(149, 74, 151), rgb(12, 0, 12) 65%);"
        >
          <a target="_blank" href="https://chrome.google.com/webstore/detail/dekusan/anlicggbddjeebblaidciapponbpegoj">
          <img src="/img/install dekusan wallet.svg"
            style="margin:0 auto"
            alt="Install DekuSan Wallet"/>
          </a>
      </v-card>
    </v-dialog>
    <v-dialog
      persistent
      v-model="alertdialog">
      <v-card>
        <v-card-title>
          {{ alerttext }}
        </v-card-title>
        <v-card-actions>
          <v-btn @click="alertdialog=false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-content>
</template>

<script>
// @ is an alias to /src
import dmtContract from '@/../build/contracts/DMTWiFiBox.json'
import Web3 from 'web3'
const DEXON_TESTNET_ID = 238

export default {
  name: 'home',
  data () {
    return {
      WS_PROVIDER: () => {
        if (window.ethereum) {
          return 'ws://' + window.location.hostname + ':8545'
        }
        return (window.location.hostname === 'localhost')
          ? 'ws://127.0.0.1:8545'
          : 'wss://ws-proxy.dexon.org'
      },
      INJECTED: window.dexon || window.ethereum,
      netid: window.location.hostname === 'localhost' ? 5777 : 238,
      hsABI: dmtContract.abi,
      hsAddress: dmtContract.networks[ window.location.hostname === 'localhost' ? 5777 : 238 ].address,
      dmtContractWrite: null,
      dmtContractRead: null,
      logined: false,
      userdata: {
        addr: null,
        balance: null
      },
      currency: 'ether',
      wsHandler: null,
      dialog: false,
      alertdialog: false,
      alerttext: '',
      piaddr: null,
      ipaddr: null,
      onlineEvents: [],
      offlineEvents: [],
      depositEvents: [],
      deductionEvents: []
    }
  },
  mounted () {
    this.wsHandler = new Web3(this.WS_PROVIDER())
    this.dmtContractRead = new this.wsHandler.eth.Contract(this.hsABI, this.hsAddress)
  },
  methods: {
    report: function () {
      const filter = { fromBlock: 0, toBlock: 'latest'}; // filter for your address
      const events = this.dmtContractRead.events.allEvents(filter); // get all events

      this.dmtContractRead.getPastEvents(
        'online',
        {
          fromBlock: 0,
          toBlock: 'latest'
        }
      ).then(res=>{
        this.onlineEvents = res;
      });

      this.dmtContractRead.getPastEvents(
        'offline',
        {
          fromBlock: 0,
          toBlock: 'latest'
        }
      ).then(res=>{
        this.offlineEvents = res;
      });
      
      this.dmtContractRead.getPastEvents(
        'deposit',
        {
          fromBlock: 0,
          toBlock: 'latest'
        }
      ).then(res=>{
        this.depositEvents = res;
      });

       this.dmtContractRead.getPastEvents(
        'deduction',
        {
          fromBlock: 0,
          toBlock: 'latest'
        }
      ).then(res=>{
        this.deductionEvents = res;
      });
      
    },
    getWSHandler: async function () {
      let WS_PROVIDER = (
        window.ethereum
          ? 'ws://' + window.location.hostname + ':8545'
          : (window.location.hostname === 'localhost'
            ? 'ws://127.0.0.1:8545'
            : 'wss://ws-proxy.dexon.org'
          )
      )
      let handler = await new Web3(WS_PROVIDER)()
      return handler
    },
    enableDexon: async function () {
      let e
      await this.INJECTED.enable().catch(err => { e = err })
      if (e) {
        return false
      }
      return true
    },
    login: async function () {
      if (!this.INJECTED) {
        this.needDekuSan()
        return
      }
      if (!this.enableDexon()) {
        this.alerttext = 'Please accept to interact with DekuSan'
        this.alertdialog = true
        return
      }
      this.walletHandler = await new Web3(this.INJECTED)
      this.netid = await this.walletHandler.eth.net.getId()
      if ((this.netid !== DEXON_TESTNET_ID) && (window.location.hostname !== 'localhost')) {
        this.alerttext = 'Please Select "DEXON Test Network" in DekuSan wallet'
        this.alertdialog = true
        return
      }
      this.dmtContractWrite = await new this.walletHandler.eth.Contract(
        this.hsABI, this.hsAddress)
      this.getUserData()
    },
    getUserData: async function () {
      let that = this
      await this.walletHandler.eth.getAccounts().then(accounts => {
        if (accounts.length === 0) {
          that.alerttext = 'Account not found'
          that.alert = true
          return false
        }
        that.walletHandler.eth.defaultAccount = accounts[0]
        that.userdata.addr = accounts[0]
        that.getBalance(that.userdata.addr).then((result) => {
          let r = that.walletHandler.utils.fromWei(result, 'ether')
          that.userdata.balance = r
          that.logined = true
        })
      }).catch(e => {
        console.log(e)
      })
      return this.userdata
    },
    getBalance: async function () {
      let coinbase = await this.walletHandler.eth.getCoinbase()
      let balance = await this.walletHandler.eth.getBalance(coinbase)
      return balance
    },
    needDekuSan: function () {
      this.dialog = true
    }
  }
}
</script>
