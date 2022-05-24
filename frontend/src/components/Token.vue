<template>
  <h1>欢迎使用LT web dapp</h1>
  <div v-if="isInstalled" class="box">
    <a-row>
      <a-col :span="8">
        <a-select v-model:value="current" style="width: 100%">
          <a-select-option v-for="ac in accounts" :key="ac">{{ ac }}</a-select-option>
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

export default {
  name: "Token",
  data() {
    return {
      ethereum: null,
      chainId: 0,
      current: null,
      accounts: [],
      minting: false,
      tokenContract: null,
      dataSource: []
    };
  },
  async mounted() {
    if (this.isInstalled) {
      this.ethereum = window.ethereum;
      await this.getChainId();
      await this.getAccounts();
    }
  },

  computed: {
    isInstalled() {
      return !!window.ethereum;
    },
    columns() {
      return [
        {
          title: "账户",
          dataIndex: "account",
          key: "account",
          width: "400px"
        },
        {
          title: "余额(LT)",
          dataIndex: "balance",
          key: "balance",
          width: "100px"

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
      console.log(await this.tokenContract.name());
      console.log(await this.tokenContract.symbol());
      console.log(await this.tokenContract.owner());
      console.log("balance",await this.formatEther(this.tokenContract.balanceOf(this.tokenContract.owner())));
      // this.tokenContract.on("Transfer", (from, to, amount, event) => {
      //   console.log(`${ from } sent ${ this.formatEther(amount) } to ${ to}`);
      //   // The event object contains the verbatim log data, the
      //   // EventFragment and functions to fetch the block,
      //   // transaction and receipt and event functions
      // });
    },
    formatEther(amount){
      return ethers.utils.formatUnits(amount, 18)
    },
    getSigner(){
      return this.provider.getSigner(0);
    },

    mint() {
      if (!this.current) return;
      if (this.minting) {
        this.$message.info("正在铸币中，请稍后...")
        return;
      }
      const signer = this.getSigner();
      if (!signer){
        this.$message.error("错误， 不能找到signer")
        return;
      }
      this.minting = true;
      const daiWithSigner = this.tokenContract.connect(signer);
      // Each DAI has 18 decimal places
      const dai = ethers.utils.parseUnits("5.0", 18);
      const tx = daiWithSigner.transfer("ricmoo.firefly.eth", dai);
      this.minting = false;
      console.log("tx", tx)
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
    }
  },
  watch: {
    async accounts() {
      if (!this.tokenContract) {
        await this.getTokenContract();
      }
      this.dataSource.length = 0;
      for (const idx in this.accounts || {}) {
        const account = this.accounts[idx];
        const balance = parseInt(this.formatEther(await this.tokenContract.balanceOf(account), 18), 10)
        this.dataSource.push({
          account,
          balance
        })
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