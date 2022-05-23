<template>
  <div v-if="isInstalled">asfasfafsas</div>
  <div v-else>Something wrong!</div>
</template>

<script>
import { catchEm } from "../util";

export default {
  name: "Token",
  data() {
    return {
      provider: null,
      chainId: 0,
      accounts: null
    };
  },
  async mounted() {
    if (this.isInstalled) {
      this.provider = window.ethereum;
      await this.getChainId();
      await this.getAccounts();
    }
  },

  computed: {
    isInstalled() {
      return !!window.ethereum;
    }
  },
  methods: {
    async getChainId() {
      const [err1, chainId] = await catchEm(this.provider.request({ method: "eth_chainId" }));
      if (err1) {
        console.error(err1);
      }
      this.chainId = chainId;
    },
    async getAccounts(){
      const [err2, accounts] = await catchEm(this.provider.request(
        {
          method: "wallet_requestPermissions" ,
          params:[
            {
              "eth_accounts": {}
            }
          ]
        }));
      if (err2){
        console.error(err2)
        return;
      }
      this.accounts = accounts[0]?.caveats[0]?.value || []
      console.log(this.accounts)
    },
  }
};
</script>

<style scoped>

</style>