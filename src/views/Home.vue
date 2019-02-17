<template>
  <v-content style="height:calc(100vh - 80px)">
    <v-card flat>
      <v-card-text v-if="logined">
        <v-btn @click="registerUser">Register</v-btn>
      </v-card-text>
      <hr>
      <v-card-text fluid v-if="logined">
        <v-layout>
          <v-flex xs30 sm6 md3>
            <v-layout column>
              <v-flex xs4>
                <v-btn @click="deposit">Deposit</v-btn>
              </v-flex>
              <v-flex xs12>
                <v-text-field
                  label="Mobile Token"
                  placeholder=""
                  outline
                  full-width
                  v-model="amountDeposit"
                ></v-text-field>
              </v-flex>
              <v-flex xs12>
                <v-text-field
                  label="User Address"
                  placeholder=""
                  outline
                  v-model="depositUserAddress"
                ></v-text-field>
              </v-flex>
            </v-layout>
          </v-flex>
        </v-layout>
        <v-layout>
          <v-flex xs14 sm6 md3>
            <v-layout>
              <v-flex xs4>
                <v-btn @click="query">Query</v-btn>
              </v-flex>
              <v-flex xs6>
                {{ amountQuery }}
              </v-flex>
            </v-layout>
          </v-flex>
        </v-layout>
      </v-card-text>
      <hr>
      <v-card-text v-if="!logined">
        <v-btn @click="login">{{ $t('home.login') }}</v-btn>
      </v-card-text>
      <v-card-text v-if="logined">
        <!-- address: {{ userdata.addr.substring(0,6) + "..." + userdata.addr.substring(userdata.addr.length - 6) }}<br> -->
        balance: {{ userdata.balance}}<br>
        <v-btn @click="online">send online signal</v-btn>
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
import ipUtils from 'ip2long'
import request from 'request'
import rp from 'request-promise'

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
      amountDeposit: null,
      depositUserAddress : null,
      amountQuery: ""
    }
  },
  mounted () {
    this.wsHandler = new Web3(this.WS_PROVIDER())
    this.dmtContractRead = new this.wsHandler.eth.Contract(this.hsABI, this.hsAddress)
  },
  methods: {
    getPiInfo () {
      
    },
    online: function () {
      // this.getPiInfo()
      let that = this;
      rp('http://localhost:3000/ipaddr')
          .then(function (res) {
              // Process...
              var myipaddr = JSON.parse(res).ipaddr
              var mypiaddr = JSON.parse(res).piaddr
              if (typeof mypiaddr !== 'undefined'){
                that.piaddr = mypiaddr
              } else {
                that.piaddr = "0x7530d137d74c4277747bF551c5b3B43c212750f8"; // test only
              }
              that.ipaddr = ipUtils.ip2long(myipaddr);
              if(isNaN(that.ipaddr)){
                 that.ipaddr = ipUtils.ip2long('127.0.0.1');
              }
              that.dmtContractWrite.methods.userOnline(that.piaddr, that.ipaddr)
                .send({ from: that.userdata.addr, gas: that.gasFee });
          })
          .catch(function (err) {
              // Failed...
              console.log(err);
          });        
    },
    registerUser: function () {
      this.dmtContractWrite.methods.registerUser()
        .send({ from: this.userdata.addr, gas: this.gasFee })
    },
    getUserData: function () {
      this.dmtContractRead.methods.users().call(this.walletHandler.accounts[0], function(err, result){
          if(!err){
              console.log(result);
          }else{
              console.log(err);
          }
      });
    },
    deposit: function () {
      var etherAmount = this.wsHandler.utils.toBN(this.amountDeposit);
      var weiValue = this.wsHandler.utils.toWei(etherAmount,'ether');
      this.dmtContractWrite.methods.increaseCredit(this.depositUserAddress)
        .send({ from: this.userdata.addr, gas: this.gasFee, value: weiValue }, function(err, res){ })
    },
    query: function () {
      this.dmtContractRead.methods.getUserCredit(this.userdata.addr)
        .call().then(res=>{
          this.amountQuery = res;});
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
        that.depositUserAddress = that.userdata.addr
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
