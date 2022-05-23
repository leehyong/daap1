const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("mumbai network", function () {
  const mumbaiChainId = 80001;
  it("test mumbai network", async function () {
    const addrs = await ethers.getSigners();
    console.log("addrs", addrs)
    for (const addr of addrs){
      console.log(addr);
    }

  });
});
