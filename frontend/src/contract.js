import TokenArtifact from "./contracts/Token.json";
import contractAddress from "./contracts/contract-address.json";
import { ethers } from "ethers";
import state from "./store";

export  const PROVIDER = new ethers.providers.Web3Provider(window.ethereum);
export  const TOKEN_CONTRACT = new ethers.Contract(
  contractAddress.Token,
  TokenArtifact.abi,
  PROVIDER.getSigner()
);


TOKEN_CONTRACT.on("Transfer", (from, to, amount, event) => {
  console.log(`${ from } sent ${ amount } to ${ to}, event:${event}`);
  state.setAction({
    from:from.toLowerCase(),
    to:to.toLowerCase(),
    amount:amount.toString(),
    data: true,
  })
  // The event object contains the verbatim log data, the
  // EventFragment and functions to fetch the block,
  // transaction and receipt and event functions
});