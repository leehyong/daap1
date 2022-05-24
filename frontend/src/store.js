import { reactive } from "vue";

function defaultTransfer() {
  return Object.assign({}, {
    from: "",
    to: "",
    amount: 0,
    data: false
  });
}

export default {
  debug: false,

  state: reactive({
    transfer: defaultTransfer()
  }),

  setAction(newValue) {
    if (this.debug) {
      console.log("setMessageAction triggered with", newValue);
    }

    this.state.transfer = newValue;
  },

  clearAction() {
    if (this.debug) {
      console.log("clearMessageAction triggered");
    }
    this.state.transfer = defaultTransfer();
  }
};