// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  await hre.run("compile");
  const [deployer] = await hre.ethers.getSigners();
  const BatchPayLib = await ethers.getContractFactory("BatchPay");
  const library = await BatchPayLib.deploy();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());
  // We get the contract to deploy
  // const Token = await hre.ethers.getContractFactory("ERC1155UUPSPaymentRedeemToken");
  // const token = await hre.upgrades.deployProxy(Token, { kind: "uups" });
  // console.log("UupsToken deployed to:", token.address);
  const payRedeem = await hre.ethers.getContractFactory("ERC1155UUPSBatchPaymentRedeemToken",
    {
      libraries: {
        BatchPay: library.address
      }
    });

  // const proxyAddress = "0xffBc02DAb96E250CF898499097a9FC225BB0eDd0";
  const proxyAddress = "0xbD97E501F0A0D90f4C3121436D88636A1f588aED";
  const payRedeemToken = await upgrades.upgradeProxy(
    proxyAddress, payRedeem,
    { unsafeAllow: ["external-library-linking"] });
  await payRedeemToken.deployed();
  console.log("UupsToken deployed to:", payRedeemToken.address);
  saveFrontendFiles(payRedeemToken);
}


function saveFrontendFiles(token) {
  const fs = require("fs");
  const contractsDir = __dirname + "/../frontend/src/contracts";

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    contractsDir + "/contract-address.json",
    JSON.stringify({ Token: token.address }, undefined, 2)
  );

  const TokenArtifact = artifacts.readArtifactSync("ERC1155UUPSBatchPaymentRedeemToken");

  fs.writeFileSync(
    contractsDir + "/Token.json",
    JSON.stringify(TokenArtifact, null, 2)
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
