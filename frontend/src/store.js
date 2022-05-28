import { reactive } from "vue";

function defaultTransfer() {
  return Object.assign({}, {
    from: "",
    to: "",
    amount: 0,
    data: false,
    tokenId: 0
  });
}

function defaultTransferBatch() {
  return Object.assign({}, {
    from: "",
    to: "",
    amounts: [],
    data: false,
    tokenIds: []
  });
}

function defaultLeftToken() {
  return Object.assign({}, {
    account: "",
    amount: "",
    tokenId: 0,
    data: false
  });
}

function defaultRedeemToken() {
  return Object.assign({}, {
    account: "",
    amount: "",
    tokenId: 0,
    data: false
  });
}

const states = reactive({
  transfer: defaultTransfer(),
  transferBatch: defaultTransferBatch(),
  leftToken: defaultLeftToken(),
  redeemToken: defaultRedeemToken()
});

export default {
  debug: true,
  state: states,

  setAction(options) {
    if (this.debug) {
      console.log("setMessageAction triggered with", options);
    }
    if (!options) return;
    if (!this.state)this.state = states;
    const { transfer, transferBatch, leftToken, redeemToken } = options;
    for (let prop in this.state) {
      if (this.state.hasOwnProperty(prop)) {
        switch (prop) {
          case "transfer":
            this.state[prop] = transfer;
            break;
          case "transferBatch":
            this.state[prop] = transferBatch;
            break;
          case "leftToken":
            this.state[prop] = leftToken;
            break;
          case "redeemToken":
            this.state[prop] = redeemToken;
            break;
        }
      }
    }
  },

  clearAction(options) {
    if (this.debug) {
      console.log("clearMessageAction triggered", options);
    }
    if (!options) return;
    const { all, transfer, transferBatch, leftToken, redeemToken } = options;
    if (!!all) {
      this.state.transfer = defaultTransfer();
      this.state.transferBatch = defaultTransferBatch();
      this.state.leftToken = defaultLeftToken();
      this.state.redeemToken = defaultRedeemToken();

    } else {
      if (transfer)
        this.state.transfer = defaultTransfer();

      if (transferBatch)
        this.state.transferBatch = defaultTransferBatch();

      if (leftToken)
        this.state.leftToken = defaultLeftToken();

      if (redeemToken)
        this.state.redeemToken = defaultRedeemToken();
    }
  }
};