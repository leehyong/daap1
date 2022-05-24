import TokenArtifact from "./contracts/Token.json";
import contractAddress from "./contracts/contract-address.json";
import { ethers } from "ethers";


export  const PROVIDER = new ethers.providers.Web3Provider(window.ethereum);
export  const TOKEN_CONTRACT = new ethers.Contract(
  contractAddress.Token,
  TokenArtifact.abi,
  PROVIDER.getSigner()
);