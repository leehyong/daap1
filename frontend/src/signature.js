import { ethers } from "ethers";

async function signatureOne(signer, toAddress, contractAddress, tokenId, nonce, amount) {
  // https://github.com/ethers-io/ethers.js/issues/468
  // step 1
  // 66 byte string, which represents 32 bytes of data
  // 单次交易签名
  // const signerAddress = await signer.getAddress();

  const messageHash = ethers.utils.solidityKeccak256(
    ["address", "address", "uint256", "uint256", "uint256"],
    [toAddress, contractAddress, tokenId, nonce, amount]
  );
  // step 2
  // 32 bytes of data in Uint8Array
  let messageHashBinary = ethers.utils.arrayify(messageHash);
  console.log('messageHashBinary', messageHashBinary)
  // return messageHashBinary;
  // // step 3
  const sig =  await signer.signMessage(messageHashBinary);
  console.log('sig', sig)
  return sig;
}

async function signatureBatch(signer, toAddress, contractAddress, tokenIds, nonce, amounts) {
  // https://github.com/ethers-io/ethers.js/issues/468
  // 66 byte string, which represents 32 bytes of data
  // 多次交易签名

  let types = ["address", "address", "uint256"];
  let values = [toAddress, contractAddress, nonce];

  for (let i = 0; i < tokenIds.length; ++i) {
    types.push("uint256", "uint256");
    values.push(tokenIds[i], amounts[i]);
  }
  // 32 bytes of data in Uint8Array
  let messageHash = ethers.utils.arrayify(ethers.utils.solidityKeccak256(types, values));
  return await signer.signMessage(messageHash);
}

export {signatureOne, signatureBatch};