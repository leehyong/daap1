import { createStore } from "vuex";

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

const debug = true;
export default createStore({
  state() {
    return {
      transfer: defaultTransfer(),
      transferBatch: defaultTransferBatch(),
      leftToken: defaultLeftToken(),
      redeemToken: defaultRedeemToken()
    };
  },
  mutations: {
    setAction(state, options) {
      if (debug) {
        console.log("setMessageAction triggered with", options, state);
      }
      const { prop, data } = options;
      if (state.hasOwnProperty(prop))
      switch (prop) {
        case "transfer":
          state.transfer = Object.assign({}, defaultTransfer(), data);
          break;
        case "transferBatch":
          state.transferBatch = Object.assign({}, defaultTransferBatch(), data);
          break;
        case "leftToken":
          state.leftToken = Object.assign({}, defaultLeftToken(), data);
          break;
        case "redeemToken":
          state.redeemToken = Object.assign({}, defaultRedeemToken(), data);
          break;
      }
    },

    clearAction(state, prop) {
      if (debug) {
        console.log("clearMessageAction triggered", prop, state);
      }
      switch (prop) {
        case "transfer":
          state.transfer = defaultTransfer();
          break;
        case "transferBatch":
          state.transferBatch = defaultTransferBatch();
          break;
        case "leftToken":
          state.leftToken = defaultLeftToken();
          break;
        case "redeemToken":
          state.redeemToken = defaultRedeemToken();
          break;
        case "all":
          state.transfer = defaultTransfer();
          state.transferBatch = defaultTransferBatch();
          state.leftToken = defaultLeftToken();
          state.redeemToken = defaultRedeemToken();
          break;
      }
    }
  }
});