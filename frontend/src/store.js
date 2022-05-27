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

export default {
  debug: false,
  state: reactive({
    transfer: defaultTransfer(),
    transferBatch: defaultTransferBatch(),
    leftToken: defaultLeftToken(),
    redeemToken: defaultRedeemToken()
  }),

  setAction(options) {
    if (this.debug) {
      console.log("setMessageAction triggered with", newValue);
    }
    if (!options || Object.keys(options).length === 0) return
    const { transfer, transferBatch, leftToken, redeemToken } = options;
    let _state = this.state;
    const setProp = (prop) => {
      const value = eval(prop);
      if (value && Object.keys(value).length > 0) _state[prop] = value;
    };
    for (let prop in this.state) {
      if (this.state.hasOwnProperty(prop))
        setProp(prop);
    }
  },

  clearAction(options) {
    if (this.debug) {
      console.log("clearMessageAction triggered");
    }
    if (!options || Object.keys(options).length === 0) return
    const { all, transfer, transferBatch, leftToken, redeemToken } = options;
    if (!!all) {
      this.state.transfer = defaultTransfer();
      this.state.transferBatch = defaultTransferBatch();
      this.state.leftToken = defaultLeftToken();
      this.state.redeemToken = defaultRedeemToken();

    } else {
      if (!!transfer)
        this.state.transfer = defaultTransfer();

      if (!!transferBatch)
        this.state.transferBatch = defaultTransferBatch();

      if (!!leftToken)
        this.state.leftToken = defaultLeftToken();

      if (!!redeemToken)
        this.state.redeemToken = defaultRedeemToken();
    }
  }
};