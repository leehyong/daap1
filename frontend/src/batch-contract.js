import TokenArtifact from "./contracts/Token.json";
import contractAddress from "./contracts/contract-address.json";
import { ethers } from "ethers";
import stateStore from "./store";


// key： 以太坊地址(小写)， value： 私钥
export const PROVIDER = new ethers.providers.Web3Provider(window.ethereum);
export const TOKEN_CONTRACT = new ethers.Contract(
  contractAddress.Token,
  TokenArtifact.abi,
  PROVIDER.getSigner()
);


TOKEN_CONTRACT.on("TransferSingle", (_, from, to, tokenId, amount, event) => {
  // The event object contains the verbatim log data, the
  // EventFragment and functions to fetch the block,
  // transaction and receipt and event functions
  console.log(`${from} ${tokenId} sent ${amount} to ${to}, event:${event}`);
  stateStore.commit("setAction", {
    prop: "transfer",
    data: {
      from: from.toLowerCase(),
      to: to.toLowerCase(),
      amount: parseInt(amount.toString(), 10),
      tokenId: parseInt(tokenId.toString(), 10),
      data: true
    }
  });
});

TOKEN_CONTRACT.on("Redeem", (account, tokenId, amount, event) => {
  // The event object contains the verbatim log data, the
  // EventFragment and functions to fetch the block,
  // transaction and receipt and event functions
  console.log(`${account} ${tokenId} , ${amount} redeemed, event:${event}`);
  stateStore.commit("setAction", {
    prop: "redeemToken",
    data: {
      account: account.toLowerCase(),
      amount: parseInt(amount.toString(), 10),
      tokenId: parseInt(tokenId.toString(), 10),
      data: true
    }
  });
});

TOKEN_CONTRACT.on("LeftToken", (account, tokenId, amount, event) => {
  // The event object contains the verbatim log data, the
  // EventFragment and functions to fetch the block,
  // transaction and receipt and event functions
  console.log(`${account} ${tokenId},  ${amount}left, event:${event}`);
  stateStore.commit("setAction", {
    prop: "leftToken",
    data: {
      account: account.toLowerCase(),
      amount: parseInt(amount.toString(), 10),
      tokenId: parseInt(tokenId.toString(), 10),
      data: true
    }
  });
});

TOKEN_CONTRACT.on("TransferBatch", (_, from, to, tokenIds, amounts, event) => {
  // The event object contains the verbatim log data, the
  // EventFragment and functions to fetch the block,
  // transaction and receipt and event functions
  console.log(`${from} ${tokenIds} sent ${amounts} to ${to}, event:${event}`);
  stateStore.commit("setAction", {
    prop: "transferBatch",
    data: {
      from: from.toLowerCase(),
      to: to.toLowerCase(),
      amounts: amounts.map(val => parseInt(val.toString(), 10)),
      tokenIds: tokenIds.map(val => parseInt(val.toString(), 10)),
      data: true
    }
  });
});