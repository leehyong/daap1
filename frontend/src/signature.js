const ethers = require("ethers");

async function signature(signer, contractAddress, tokenId, nonce, amount){
  // https://github.com/ethers-io/ethers.js/issues/468
  // step 1
  // 66 byte string, which represents 32 bytes of data
  const messageHash = ethers.utils.solidityKeccak256(
    ["address", "address", "uint256", "uint256", "uint256"],
    [signer.address, contractAddress, tokenId, nonce, amount]
  );
  // step 2
  // 32 bytes of data in Uint8Array
  let messageHashBinary = ethers.utils.arrayify(messageHash);
  // step 3
  return await signer.signMessage(messageHashBinary);
}


module.exports = {
  signature
}