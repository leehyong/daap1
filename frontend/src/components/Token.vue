<template>
  <h1>欢迎使用LT web dapp</h1>
  <div v-if="isInstalled" class="box">
    <a-row>
      <a-col :span="8">
        <a-select v-model:value="current" style="width: 100%">
          <a-select-option v-for="ac in selectAccountOptions" :key="ac">{{ ac }}</a-select-option>
        </a-select>
      </a-col>
      <a-col :span="4" :offset="1">
        <a-button @click="mint">铸币</a-button>
      </a-col>
    </a-row>
    <a-table :dataSource="dataSource" :columns="columns" class="table" />
  </div>
  <div v-else>Something wrong!</div>
</template>

<script>
import TokenArtifact from "../contracts/Token.json";
import contractAddress from "../contracts/contract-address.json";
import { catchEm } from "../util";
import { ethers } from "ethers";
import { formatEther } from "@ethersproject/units/src.ts/index";

export default {
  name: "Token",
  data() {
    return {
      ethereum: null,
      chainId: 0,
      owner: null,
      current: null,
      accounts: [],
      minting: false,
      tokenContract: null,
      dataSource: [],
    };
  },
  async created() {
    if (this.isInstalled) {
      this.ethereum = window.ethereum;
      await this.getChainId();
      await this.getAccounts();
      await this.getTokenContract();
    }
  },

  computed: {
    selectAccountOptions(){
      const owner = this.owner;
      console.log("owner", owner)
      return this.accounts.filter(val => val !== owner)
    },

    isInstalled() {
      return !!window.ethereum;
    },
    columns() {
      return [
        {
          title: "账户",
          dataIndex: "account",
          key: "account",
          maxWidth: "400px"
        },
        {
          title: "余额(LT)",
          dataIndex: "balance",
          key: "balance",
          maxWidth: "100px"
        }
      ];
    }
  },
  methods: {
    async getTokenContract() {
      this.provider = new ethers.providers.Web3Provider(this.ethereum);
      this.tokenContract = new ethers.Contract(
        contractAddress.Token,
        TokenArtifact.abi,
        this.getSigner()
      );
      this.owner = await this.tokenContract.owner();
      this.owner = this.owner.toLowerCase()
      console.log(this.owner);
      console.log(await this.tokenContract.name());
      console.log(await this.tokenContract.symbol());
      // this.tokenContract.on("Transfer", (from, to, amount, event) => {
      //   console.log(`${ from } sent ${ this.formatEther(amount) } to ${ to}`);
      //   // The event object contains the verbatim log data, the
      //   // EventFragment and functions to fetch the block,
      //   // transaction and receipt and event functions
      // });
    },
    formatEther(amount) {
      return ethers.utils.formatEther(amount);
    },
    getSigner() {
      return this.provider.getSigner(0);
    },

    async mint() {
      if (!this.current) return;
      if (this.minting) {
        this.$message.info("正在铸币中，请稍后...");
        return;
      }
      const signer = this.getSigner();
      if (!signer) {
        this.$message.error("错误， 不能找到signer");
        return;
      }
      this.minting = true;
      const daiWithSigner = this.tokenContract.connect(signer);
      // Each DAI has 18 decimal places
      const dai = ethers.utils.parseEther("5.0");
      const tx = daiWithSigner.transfer(this.current, dai);
      console.log("tx", tx);
      for (let ac in this.dataSource) {
        if (ac.account === this.current || ac.account === this.owner) {
          ac.balance = await this.getAccountBalance(ac.account);
          console.log("update balance", ac.account, tx,);
          break;
        }
      }
      this.minting = false;
    },

    async getChainId() {
      const [err1, chainId] = await catchEm(this.ethereum.request({ method: "eth_chainId" }));
      if (err1) {
        console.error(err1);
      }
      this.chainId = chainId;
    },

    async getAccounts() {
      const [err2, accounts] = await catchEm(this.ethereum.request(
        {
          method: "wallet_requestPermissions",
          params: [
            {
              "eth_accounts": {}
            }
          ]
        }));
      if (err2) {
        console.error(err2);
        return;
      }
      this.accounts = accounts[0]?.caveats[0]?.value || {};
    },

    async getAccountBalance(account) {
      const balance = await this.tokenContract.balanceOf(account);
      return balance.toString();
    }
  },
  watch: {
    async accounts(val) {
      if (!val || val.length === 0) return
      if (!this.tokenContract){
        await this.getTokenContract();
      }
      this.dataSource.length = 0;
      for (const idx in this.accounts || {}) {
        const account = this.accounts[idx];
        this.dataSource.push({
          account,
          balance: await this.getAccountBalance(account)
        });
      }
    }
  }
};
</script>

<style scoped>
.box {
  width: 100%;
  height: 100%;
}

.table {
  margin-top: 10px;
}

.box h1 {
  text-align: center;
  margin-bottom: 10px;
}
</style>