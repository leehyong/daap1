<template>
  <div v-if="isInstalled">asfasfafsas</div>
  <div v-else>Something wrong!</div>
</template>

<script>
import {catchEm} from '../util';
export default {
  name: "Signers",
  data() {
    return {
      provider: null,
      chainId: 0,
      accounts:null,
    };
  },
   async mounted() {
    if (this.isInstalled){
      this.provider = window.ethereum;
      const [err1, chainId] =  await catchEm(this.provider.request({ method: "eth_chainId" }));
      if(err1) {
        console.log(err1);
        return
      }
      const [err2, accounts] = await catchEm(this.provider.request({ method: "eth_requestAccounts" }));
      if(err2) {
        if (err2.code === 4001) {
          // EIP-1193 userRejectedRequest error
          console.log('Please connect to MetaMask.');
        } else {
          console.error(err2);
        }
        return
      }
      this.chainId = chainId;
      this.accounts = accounts;
    }
  },

  computed: {
    isInstalled() {
      return !!window.ethereum;
    }
  }

};
</script>

<style scoped>

</style>