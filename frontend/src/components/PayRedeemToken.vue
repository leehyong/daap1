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
        <a-select v-model:value="tokenId" mode="tags" style="width: 100%">
          <template #tagRender>{{ tokens[tokenId] }}</template>
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
          <template #title>只能选择同一账户下的不同token 进行批量支付"</template>
          <a-button :disabled="selectedRows.length === 0" @click="payBatch">批量支付</a-button>
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
                <template #title v-show="record.balance == 0">账户余额大于0才能使用支付功能</template>
                <a-button @click="payOne(record)" :disabled="record.balance == 0" v-if="record.account !== owner">支付</a-button>
              </a-tooltip>
            </a-col>
            <a-col flex="1">
              <a-button @click="redeemOne(record)" v-if="record.account !== owner">赎回</a-button>
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
      <a-row v-for="record in payRecords" :key="record.account + record.tokenId">
        <a-col :span="16" style="display: flex;place-items: center">
          <span style="color: blue;text-overflow: ellipsis" :title="record.account">{{ record.account }}</span>
        </a-col>
        <a-col :span="5">
          <a-input-number v-model:value="record.payAmount" :min="1" :max="1000" placehodler="支付数量" />
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
      chainId: 0,
      owner: null,
      tokens: { 1: "Rock", 2: "Paper", 3: "Scissors" },
      tokenId: 1,
      mintAddr: null,
      accounts: [],
      minting: false,
      tokenContract: null,
      dataSource: [],
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
        "确认向",
        h("span", { style: { color: "red" } }, [this.owner]),
        this.payRecords.length > 1 ? "进行批量支付吗？" : "进行支付吗？"
      ]);
    },

    rowSelection() {
      return {
        selectedRowKeys: this.selectedRowKeys,
        onChange: this.onSelectChange,
        hideSelectAll: true,
        getCheckboxProps: record => {
          // owner 或者没有余额时，都不能支付
          let disabled = record.account === this.owner || record.balance < 1; // owner 不能进行批量支付
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
            return h("span", {}, children);
          },
          maxWidth: 400
        },
        {
          title: "余额",
          dataIndex: "balance",
          maxWidth: 100,
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
    payOne(record) {
      if (record.balance < 1) return
      this.payRecords.length = 0;
      record.payAmount = 1;
      record.payTokenId = 1;
      console.log(record);
      this.payRecords.push(record);
    },
    redeemOne(record) {
      console.log("redeemOne");
    },
    payBatch() {
      this.payRecords.length = 0;
      for (let record of this.selectedRows) {
        if (record.balance < 1) continue
        record.payAmount = 1;
        this.payRecords.push(record);
      }
    },
    async confirmPay() {
      if (this.payRecords.length === 0) return;
      // 不管是批量支付还是单个支付， 地址都是同一个
      const signer = PROVIDER.getSigner(this.payRecords[0].account);
      const addrContract = TOKEN_CONTRACT.connect(signer);
      let _signature;
      let tx;
      const nonce = new Date().valueOf();
      if (this.payRecords.length > 1) {
        // 批量支付
        let ids = this.payRecords.map(item => item.tokenId);
        let amounts = this.payRecords.map(item => item.payAmount);
        _signature = signatureBatch(signer, TOKEN_CONTRACT.address, ids, nonce, amounts);
        tx = await addrContract.batchPay({
          tokenIds: ids,
          amounts,
          signature: _signature,
          nonce
        });
      } else {
        // 单个支付
        const record = this.payRecords[0];
        _signature = signatureOne(signer, TOKEN_CONTRACT.address, record.tokenId, nonce, record.payAmount);
        tx = await addrContract.pay(record.tokenId, record.payAmount, nonce, _signature);
      }
      console.log("confirmPay", tx);
    },
    cancelPay() {
      this.payRecords.length = 0;
    },
    onSelectChange(selectedRowKeys, selectedRows) {
      this.selectedRowKeys = selectedRowKeys;
      this.selectedRows = selectedRows;
      if (this.selectedRows?.length) {
        this.selectedFirstAccount = this.selectedRows[0].account;
      } else {
        this.selectedFirstAccount = "";
      }
    },
    async getTokenContract() {
      this.owner = await TOKEN_CONTRACT.owner();
      this.owner = this.owner.toLowerCase();
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
      console.log('signer', signer)
      let tx;
      try {
        this.minting = true;
        let signerAddress = await signer.getAddress();
        const daiWithSigner = await TOKEN_CONTRACT.connect(signer);
        console.log('mint', signerAddress,
          this.mintAddr,
          this.amount,
          this.tokenId,)
        tx = await daiWithSigner.safeTransferFrom(
          signerAddress,
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
      this.updateAccountLoading(this.owner, this.mintAddr, this.tokenId);
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

    async getAccountBalance(account, tokenId) {
      const balance = await TOKEN_CONTRACT.balanceOf(account, tokenId);
      return balance.toString();
    },

    updateAccountLoading(_from, _to, tokenId) {
      for (let ac of this.dataSource) {
        if (tokenId == ac.tokenId && (ac.account === _from || ac.account === _to)) {
          ac.updatingBalance = true;
        }
      }
    }
  },
  watch: {
    async accounts(val) {
      if (!val || val.length === 0) return;
      if (!this.tokenContract) {
        await this.getTokenContract();
      }
      // while (!this.tokenContract) {
      //   await sleep(100);
      // }
      this.dataSource.length = 0;
      for (const idx in this.accounts || {}) {
        const account = this.accounts[idx];
        for (let tokenId in this.tokens) {
          // console.log("tokenId, account", tokenId, account);
          this.dataSource.push({
            account,
            tokenId,
            updatingBalance: false,
            balance: await this.getAccountBalance(account, tokenId)
          });
        }

      }
    },

    async "state.transfer"(val) {
      console.log("state", val);
      if (!val || Object.keys(val).length === 0 || val.data === false) return;
      for (let ac of this.dataSource) {
        if (ac.tokenId == val.tokenId && (ac.account === val.from || ac.account === val.to)) {
          ac.balance = await this.getAccountBalance(ac.account, val.tokenId);
          ac.updatingBalance = false;
          console.log("update balance", ac.account);
        }
      }
      store.clearAction();
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