<template>
  <h1>欢迎使用LT web dapp</h1>
  <div v-if="isInstalled" class="box">
    <div><h3>请选择地址进行铸币~</h3></div>
    <a-row>
      <a-col :span="8">
        <a-select v-model:value="mintAddr" style="width: 100%">
          <a-select-option key="noop">请选择地址</a-select-option>
          <a-select-option v-for="ac in selectAccountOptions" :key="ac">{{ ac }}</a-select-option>
        </a-select>
      </a-col>
      <a-col :span="2" :offset="1">
        <a-input-number v-model:value="amount" :min="1" :max="1000" placehodler="铸币数量" />
      </a-col>
      <a-col :span="2">
        <a-select v-model:value="tokenId" style="width: 100%">
          <a-select-option v-for="(name, _tokenId) in tokens" :key="_tokenId">
            {{ name }}
          </a-select-option>
        </a-select>
      </a-col>
      <a-col :span="4" :offset="1">
        <a-button @click="mint" :disabled="minting" :type="'primary'">
          <template #icon>
            <loading-outlined v-if="minting" />
            <dollar-outlined v-else />
          </template>
          铸币
        </a-button>
      </a-col>
    </a-row>
    <a-row style="margin-top: 10px">
      <a-col :span="4">
        <a-tooltip>
          <template #title>从onwer账户批量支付不同的token给同一账户"</template>
          <a-button :disabled="selectedRowKeys.length === 0" @click="payBatch">批量支付</a-button>
        </a-tooltip>
      </a-col>
    </a-row>
    <a-table :row-selection="rowSelection" :pagination="{defaultPageSize:30}" :dataSource="dataSource"
             :columns="columns" :rowKey="rowKey" class="table">
      <template #bodyCell="{ column, record}">
        <template v-if="column.key === 'operation'">
          <a-row type="'flex" :gutter="[4,6]">
            <a-col flex="1">
              <a-tooltip>
                <template #title v-if="record.balance == 0">账户余额大于0才能使用支付功能</template>
                <a-button @click="payOne(record)" :disabled="record.balance == 0" v-if="record.account == owner">支付
                </a-button>
              </a-tooltip>
            </a-col>
            <a-col flex="1">
              <a-tooltip>
                <template #title>支付后有剩余且剩余量不低于<span class="txt-num"
                                                    style="color: red">{{
                    minPrices[record.tokenId]
                  }}</span>{{ tokens[record.tokenId] }}，才能进行赎回
                </template>
                <a-button @click="redeemOne(record)" v-if="record.account == owner" :disabled="!record.canRedeem">赎回
                </a-button>
              </a-tooltip>
            </a-col>
          </a-row>
        </template>
      </template>
    </a-table>

    <a-modal :visible="payRecords.length > 0"
             centered okText="确认"
             :title="modalTile"
             :width="660"
             cancelText="取消" @ok="confirmPay"
             @cancel="cancelPay">
      <a-row style="margin-bottom: 10px">
        <a-col :span="16" :offset="4" style="display: flex;place-items: center">
          <a-select v-model:value="payToAddr" style="width: 100%">
            <a-select-option key="noop">请选择地址</a-select-option>
            <a-select-option v-for="ac in selectAccountOptions" :key="ac">{{ ac }}</a-select-option>
          </a-select>
        </a-col>
      </a-row>
      <a-row v-for="record in payRecords" :key="record.account + record.tokenId">
        <a-col :span="5" :offset="4">
          <a-tooltip :color="'blue'" :trigger="'focus'">
            <template #title>不能低于资产价值<span class="txt-num">{{ assetValue }}</span>{{
                tokens[record.tokenId]
              }}，也不能超过余额<span
                class="txt-num">{{ record.balance }}</span>{{
                tokens[record.tokenId]
              }}
            </template>
            <a-input-number v-model:value="record.payAmount" :min="assetValue" :max="record.balance"
                            placehodler="支付数量" />
          </a-tooltip>
        </a-col>
        <a-col :span="3" style="display: flex;place-items: start">
          <span>{{ tokens[record.tokenId] }}</span>
        </a-col>
        <a-col flex="1"></a-col>
      </a-row>
    </a-modal>
  </div>
  <div v-else>Something wrong!</div>
</template>

<script>
import { PROVIDER, TOKEN_CONTRACT } from "../batch-contract";
import { LoadingOutlined, DollarOutlined, UserOutlined } from "@ant-design/icons-vue";
import { Table } from "ant-design-vue";
import { signatureOne, signatureBatch } from "../signature";
import { catchEm } from "../util";
import store from "../store";
import { h } from "vue";
import { ethers } from "ethers";

export default {
  name: "Token",
  components: {
    LoadingOutlined,
    DollarOutlined,
    UserOutlined
  },
  data() {
    return {
      ethereum: null,
      payRecords: [],
      payToAddr: null,
      confirmingPay: false,
      chainId: 0,
      owner: null,
      tokens: { 1: "Rock", 2: "Paper", 3: "Scissors" },
      tokenId: "1",
      mintAddr: null,
      assetValue: 10,
      accounts: [],
      minting: false,
      tokenContract: null,
      dataSource: [],
      minPrices: {
        1: 4,
        2: 5,
        3: 10
      },
      amount: 10,
      state: store.state,
      selectedRowKeys: [],
      selectedFirstAccount: "",
      selectedRows: []
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
    modalTile() {
      return h("p", {}, [
        "确认从",
        h("span", { style: { color: "red" } }, [this.owner]),
        this.payRecords.length > 1 ? "进行批量支付吗？" : "进行支付吗？"
      ]);
    },

    rowSelection() {
      return {
        selectedRowKeys: this.selectedRowKeys,
        onChange: this.onSelectChange,
        // type: "radio",
        hideSelectAll: true,
        getCheckboxProps: record => {
          // 不是owner 或者没有余额时，都不能支付
          let disabled = record.account !== this.owner || record.balance < 1; // owner 不能进行批量支付
          if (!disabled && this.selectedFirstAccount) {
            // 只能选择同一账户下的不同token 进行批量支付
            disabled = this.selectedFirstAccount !== record.account;
          }
          return {
            disabled
          };
        },
        selections: [Table.SELECTION_INVERT, Table.SELECTION_NONE]
      };
    },
    selectAccountOptions() {
      const owner = this.owner;
      return this.accounts.filter(val => val !== owner);
    },

    isInstalled() {
      return !!window.ethereum;
    },
    columns() {
      return [
        {
          title: "账户",
          dataIndex: "account",
          customCell: (record) => {
            return {
              onClick: () => {
                this.selectRow(record);
              },
              style: {
                cursor: "pointer"
              }
            };
          },
          customRender: ({ text, record }) => {
            let children = [text];
            if (record.account === this.owner) {
              children.push(h(UserOutlined, {
                style: {
                  marginLeft: "10px",
                  color: "red"
                }
              }));
            }
            if (record.updatingBalance) {
              children.push(h(LoadingOutlined, {
                style: {
                  marginLeft: "10px",
                  color: "blue"

                }
              }));
            }
            return h("span", {
              style: {
                cursor: "pointer"
              }
            }, children);
          },
          maxWidth: 400
        },
        {
          title: "余额",
          dataIndex: "balance",
          maxWidth: 100,
          customCell: (record) => {
            return {
              onClick: () => {
                this.selectRow(record);
              },
              style: {
                cursor: "pointer"
              }
            };
          },
          customRender: ({ text, record }) => {
            let children = [h("span", {
              style: {
                color: "blue",
                marginRight: "10px"
              }
            }, text),
              this.tokens[record.tokenId]
            ];
            return h("p", {}, children);
          }
        },
        {
          title: "操作",
          key: "operation",
          width: 200
        }
      ];
    }
  },
  methods: {
    rowKey(record) {
      return record.account + "::" + record.tokenId;
    },
    selectRow(record) {
      const idx = this.selectedRowKeys.indexOf(this.rowKey(record));
      if (idx === -1) {
        this.selectedRowKeys.push(this.rowKey(record));
      } else {
        this.selectedRowKeys.splice(idx, 1);
      }
    },
    payOne(record) {
      if (record.balance < 1) return;
      this.payRecords.length = 0;
      record.payAmount = this.assetValue;
      record.payTokenId = 1;
      console.log(record);
      this.payRecords.push(record);
    },
    async redeemOne(record) {
      if (!record.canRedeem) return;
      try {
        const signer = await this.getContractSigner();
        if (!signer) return;
        const addrContract = TOKEN_CONTRACT.connect(signer);
        const nonce = new Date().valueOf();
        const minPrice = this.minPrices[record.tokenId];
        const _sig = await signatureOne(
          signer, record.account, addrContract.address,
          record.tokenId, nonce, minPrice);
        console.log("signature", _sig);
        let tx = await addrContract.redeem(record.account, {
          tokenId: record.tokenId,
          minPrice,
          signature: _sig
        }, nonce);
        this.updateAccountLoading("", record.account, [record.tokenId]);
        console.log("redeem tx", tx);
      } catch (e) {
        console.error(e);
      }
    },
    payBatch() {
      this.payRecords.length = 0;
      for (let record of this.dataSource) {
        const rk = this.rowKey(record)
        if (this.selectedRowKeys.indexOf(rk) === -1) continue
        if (record.balance < 1) continue;
        record.payAmount = this.assetValue;
        this.payRecords.push(record);
      }
    },
    async getContractSigner() {
      try {
        let sendFrom = await this.ethereum.request({
          method: "eth_requestAccounts"
        });
        sendFrom = sendFrom && sendFrom[0].toLowerCase();
        if (!sendFrom) {
          console.log("no sendFrom");
          this.payRecords.length = 0;
          return null;
        }
        return PROVIDER.getSigner(sendFrom);
      } catch (e) {
        console.error(e);
        return null;
      }
    },
    async confirmPay() {
      if (this.payRecords?.length === 0) return;
      else if (this.confirmingPay) {
        this.$message.warn("正在支付中，请稍后再试");
        return;
      }
      this.confirmingPay = true;
      // 不管是批量支付还是单个支付， 接收方地址都是同一个
      let tx;
      try {
        let to = this.payToAddr;
        const signer = await this.getContractSigner();
        if (!signer) return;
        const addrContract = TOKEN_CONTRACT.connect(signer);
        let _signature;
        const nonce = new Date().valueOf();
        let amounts = [];
        let ids = [];
        for (let item of this.payRecords) {
          let amount = parseInt(item.payAmount, 10);
          if (amount < 1) continue;
          amounts.push(amount);
          ids.push(parseInt(item.tokenId, 10));
        }
        if (ids.length === 0) {
          this.payRecords.length = 0;
          return;
        } else if (ids.length > 1) {
          // 批量支付
          _signature = await signatureBatch(
            signer,
            to,
            addrContract.address,
            ids,
            nonce,
            amounts);
          console.log("ids-amounts", ids, amounts);
          tx = await addrContract.batchPay({
            to,
            tokenIds: ids,
            amounts,
            signature: _signature,
            nonce
          });
          this.updateAccountLoading(await signer.getAddress(), to, ids);
        } else {
          // 单个支付
          const tokenId = ids[0];
          const amount = amounts[0];
          _signature = await signatureOne(
            signer,
            to,
            addrContract.address,
            tokenId,
            nonce,
            amount);
          tx = await addrContract.pay(to, tokenId, amount, nonce, _signature);
          this.updateAccountLoading(await signer.getAddress(), to, [tokenId]);
        }
      } catch (e) {
        console.error(e);
      }
      this.confirmingPay = false;
      this.payRecords.length = 0;
      console.log("confirmPay", tx);
    },
    cancelPay() {
      if (this.confirmingPay) {
        this.$message.warning("正在支付中，不能取消...");
        return;
      }
      this.payRecords.length = 0;
    },
    onSelectChange(selectedRowKeys, selectedRows) {
      this.selectedRowKeys = selectedRowKeys;
      if (this.selectedRows?.length) {
        this.selectedFirstAccount = this.selectedRows[0].account;
      } else {
        this.selectedFirstAccount = "";
      }
    },
    async getTokenContract() {
      try {
        this.owner = await TOKEN_CONTRACT.owner();
        this.owner = this.owner.toLowerCase();
        this.assetValue = await TOKEN_CONTRACT.assetValue();
        this.assetValue = this.assetValue.toString();
      } catch (e) {
        console.log(e);
      }
      console.log(this.owner);
    },
    msgData(msg) {
      return ethers.utils.formatBytes32String(msg);
    },
    async mint() {
      if (!this.mintAddr) return;
      if (this.minting) {
        this.$message.info("正在铸币中，请稍后...");
        return;
      }
      const signer = PROVIDER.getSigner(this.owner);
      if (!signer) {
        this.$message.error("错误， 不能找到signer");
        return;
      }
      console.log("signer", signer);
      let tx;
      try {
        let sendFrom = await this.ethereum.request({
          method: "eth_requestAccounts"
        });
        sendFrom = sendFrom && sendFrom[0].toLowerCase();
        if (!sendFrom) {
          console.log("no sendFrom");
          return;
        }
        this.minting = true;
        console.log("mint", sendFrom,
          this.mintAddr,
          this.amount,
          this.tokenId);
        let signer = PROVIDER.getSigner(sendFrom);
        const addrContract = TOKEN_CONTRACT.connect(signer);
        tx = await addrContract.safeTransferFrom(
          sendFrom,
          this.mintAddr,
          this.tokenId,
          this.amount,
          this.msgData(`mint`)
        );
      } catch (e) {
        this.minting = false;
        console.error(e);
        return;
      }
      this.minting = false;
      this.updateAccountLoading(this.owner, this.mintAddr, [this.tokenId]);
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
          // method: "eth_requestAccounts",
        }));
      if (err2) {
        console.error(err2);
        return;
      }
      this.accounts = accounts[0]?.caveats[0]?.value || {};
    },

    async getAccountBalance(account, tokenId) {
      const balance = await TOKEN_CONTRACT.balanceOf(account, tokenId);
      return balance.toString();
    },

    updateAccountLoading(_from, _to, tokenIds) {
      _from = _from.toLowerCase();
      _to = _to.toLowerCase();
      for (let ac of this.dataSource) {
        for (let tid of tokenIds) {
          if (tid == ac.tokenId && (ac.account === _from || ac.account === _to)) {
            ac.updatingBalance = true;
          }
        }
      }
    }
  },
  watch: {
    async accounts(val) {
      if (!val || val?.length === 0) return;
      if (!this.tokenContract) {
        await this.getTokenContract();
      }
      this.dataSource.length = 0;
      for (const idx in this.accounts || {}) {
        const account = this.accounts[idx];
        for (let tokenId in this.tokens) {
          // console.log("tokenId, account", tokenId, account);
          this.dataSource.push({
            account,
            tokenId,
            canRedeem: false,
            updatingBalance: false,
            balance: await this.getAccountBalance(account, tokenId)
          });
        }

      }
    },

    async "state.transfer"(val) {
      if (!val || val.data === false) return;
      for (let ac of this.dataSource) {
        if (ac.tokenId == val.tokenId && (ac.account === val.from || ac.account === val.to)) {
          ac.balance = await this.getAccountBalance(ac.account, val.tokenId);
          ac.updatingBalance = false;
          console.log("update balance", ac.account);
        }
      }
      store.commit("clearAction", "transfer");
    },
    async "state.transferBatch"(val) {
      if (!val || val.data === false) return;
      for (let ac of this.dataSource) {
        if (ac.account === val.from || ac.account === val.to) {
          for (let tid of val.tokenIds) {
            ac.balance = await this.getAccountBalance(ac.account, tid);
            ac.updatingBalance = false;
            console.log("batch update balance", ac.account);
          }
        }
      }
      store.commit("clearAction", "transferBatch");
    },

    async "state.leftToken"(val) {
      if (!val || val.data === false) return;
      for (let ac of this.dataSource) {
        if (ac.account == val.account && val.tokenId == ac.tokenId) {
          ac.canRedeem = val.amount > this.minPrices[val.tokenId];
          ac.updatingBalance = false;
          if (ac.canRedeem) {
            let msg = `账户${ac.account}有剩余 ${val.amount} ${this.tokens[val.tokenId]}可以赎回!`;
            console.log(msg);
            this.$message.success(msg, 5);
          }
        }
      }
      store.commit("clearAction", "leftToken");
    },

    async "state.redeemToken"(val) {
      if (!val || val.data === false) return;
      for (let ac of this.dataSource) {
        if (ac.account == val.account && val.tokenId == ac.tokenId) {
          ac.canRedeem = false;
          ac.updatingBalance = false;
          let name = this.tokens[val.tokenId];
          let msg = `账户${ac.account}已经赎回 ${val.amount} ${name}， 手续费${this.minPrices[val.tokenId]}${name}可以赎回!`;
          console.log(msg);
          this.$message.success(msg, 5);
        }
      }
      store.commit("clearAction", "redeemToken");
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

.txt-num {
  color: black;
  font-size: 24px;
  padding: 0 6px
}
</style>