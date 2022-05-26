// We import Chai to use its asserting functions here.
const { expect } = require("chai");
const { ethers, upgrades, run } = require("hardhat");

// `describe` is a Mocha function that allows you to organize your tests. It's
// not actually needed, but having your tests organized makes debugging them
// easier. All Mocha functions are available in the global scope.

// `describe` receives the name of a section of your test suite, and a callback.
// The callback must define the tests of that section. This callback can't be
// an async function.
describe("Token contract", function() {
  // Mocha has four functions that let you hook into the test runner's
  // lifecyle. These are: `before`, `beforeEach`, `after`, `afterEach`.

  // They're very useful to setup the environment for tests, and to clean it
  // up after they run.

  // A common pattern is to declare some variables, and assign them in the
  // `before` and `beforeEach` callbacks.

  let Token;
  let RedeemToken;
  let hardhatToken;
  let owner;
  let addr1;
  let addr2;
  let addrs;
  const tokenId = 1;

  // `beforeEach` will run before each test, re-deploying the contract every
  // time. It receives a callback, which can be async.
  beforeEach(async function() {
    // Get the ContractFactory and Signers here.
    await run("compile");
    Token = await ethers.getContractFactory("ERC1155UUPSPaymentToken");
    RedeemToken = await ethers.getContractFactory("ERC1155UUPSRedeemToken");

    // Token = await ethers.getContractFactory("ERC1155UUPSToken");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    // To deploy our contract, we just have to call Token.deploy() and await
    // for it to be deployed(), which happens once its transaction has been
    // mined.
    let oldToken = await upgrades.deployProxy(Token, { kind: "uups" });
    hardhatToken = await upgrades.upgradeProxy(oldToken.address, RedeemToken);
    console.log("proxy address", hardhatToken.address);
  });

  // You can nest describe calls to create subsections.
  describe("Deployment", function() {
    // `it` is another Mocha function. This is the one you use to define your
    // tests. It receives the test name, and a callback function.

    // If the callback function is async, Mocha will `await` it.
    it("Should set the right owner", async function() {
      // Expect receives a value, and wraps it in an Assertion object. These
      // objects have a lot of utility methods to assert values.

      // This test expects the owner variable stored in the contract to be equal
      // to our Signer's owner.
      expect(await hardhatToken.owner()).to.equal(owner.address);
    });

    it("Should assign the total supply of tokens to the owner", async function() {
      let ownerBalance = await hardhatToken.balanceOf(owner.address, 1);
      expect(await hardhatToken.totalSupply2()).to.equal(ownerBalance);
      ownerBalance = await hardhatToken.balanceOf(owner.address, 2);
      expect(await hardhatToken.totalSupply2()).to.equal(ownerBalance);
      ownerBalance = await hardhatToken.balanceOf(owner.address, 3);
      expect(await hardhatToken.totalSupply2()).to.equal(ownerBalance);
    });
  });

  describe("Transactions", function() {

    it("Reverted: Invalidredeemer && Invalid signature", async function() {
      const initialOwnerBalance = await hardhatToken.balanceOf(owner.address, tokenId);
      // Transfer 100 tokens from owner to addr1.
      // Check balances.
      await expect(hardhatToken.safeTransferFrom(owner.address, addr1.address, tokenId, 100, ethers.utils.formatBytes32String("event")))
        .to.emit(hardhatToken, "TransferSingle")
        .withArgs(owner.address, owner.address, addr1.address, tokenId, 100);
      const finalOwnerBalance = await hardhatToken.balanceOf(owner.address, tokenId);
      expect(finalOwnerBalance).to.equal(initialOwnerBalance.sub(100));
      const addr1Balance = await hardhatToken.balanceOf(addr1.address, tokenId);
      expect(addr1Balance).to.equal(100);
      let amount = 33;
      const nonce = new Date().valueOf();
      // https://github.com/ethers-io/ethers.js/issues/468
      // step 1
      // 66 byte string, which represents 32 bytes of data
      let messageHash = ethers.utils.solidityKeccak256(
        ["address", "address", "uint256", "uint256", "uint256"],
        // 交换amount 和nonce 的顺序，从而故意让签名验证失败
        [addr1.address, hardhatToken.address, tokenId, nonce, amount]
      );
      // step 2
      // 32 bytes of data in Uint8Array
      let messageHashBinary = ethers.utils.arrayify(messageHash);
      const addr1Connect = await hardhatToken.connect(addr1);
      // step 3
      // const signature = await addr1Connect.signMessage(tokenId, amount, nonce)
      let signature = await addr1.signMessage(messageHashBinary);
      console.log("origin   ", addr1.address);
      console.log("recovered", ethers.utils.verifyMessage(messageHashBinary, signature));
      expect(ethers.utils.verifyMessage(messageHashBinary, signature) === addr1.address);
      await expect(
        addr1Connect.pay(tokenId, amount, nonce, signature)
      ).to.emit(hardhatToken, "TransferSingle")
        .withArgs(addr1.address, addr1.address, owner.address, tokenId, 20)
        .emit(hardhatToken, "LeftToken")
        .withArgs(addr1.address, tokenId, amount - 20);
      let minPrice = 5;
      // step 1
      // 66 byte string, which represents 32 bytes of data
      messageHash = ethers.utils.solidityKeccak256(
        ["address", "address", "uint256", "uint256", "uint256"],
        // 交换amount 和nonce 的顺序，从而故意让签名验证失败
        [addr1.address, hardhatToken.address, tokenId, minPrice, nonce]
      );
      // step 2
      // 32 bytes of data in Uint8Array
      messageHashBinary = ethers.utils.arrayify(messageHash);
      // step 3
      // const signature = await addr1Connect.signMessage(tokenId, amount, nonce)
      signature = await addr1.signMessage(messageHashBinary);
      await expect(
        addr1Connect.redeem(addr2.address, { tokenId, minPrice, signature }, nonce)
      ).to.be.revertedWith("Invalid redeemer");

      await expect(
        addr1Connect.redeem(addr1.address, { tokenId, minPrice, signature }, nonce)
      ).to.be.revertedWith("Invalid signature");

    });

    it("Reverted Used nonce", async function() {
      const initialOwnerBalance = await hardhatToken.balanceOf(owner.address, tokenId);
      // Transfer 100 tokens from owner to addr1.
      // Check balances.
      await expect(hardhatToken.safeTransferFrom(owner.address, addr1.address, tokenId, 100, ethers.utils.formatBytes32String("event")))
        .to.emit(hardhatToken, "TransferSingle")
        .withArgs(owner.address, owner.address, addr1.address, tokenId, 100);
      const finalOwnerBalance = await hardhatToken.balanceOf(owner.address, tokenId);
      expect(finalOwnerBalance).to.equal(initialOwnerBalance.sub(100));
      const addr1Balance = await hardhatToken.balanceOf(addr1.address, tokenId);
      expect(addr1Balance).to.equal(100);
      let amount = 33;
      const nonce = new Date().valueOf();
      // https://github.com/ethers-io/ethers.js/issues/468
      // step 1
      // 66 byte string, which represents 32 bytes of data
      let messageHash = ethers.utils.solidityKeccak256(
        ["address", "address", "uint256", "uint256", "uint256"],
        [addr1.address, hardhatToken.address, tokenId, nonce, amount]
      );
      // step 2
      // 32 bytes of data in Uint8Array
      let messageHashBinary = ethers.utils.arrayify(messageHash);
      const addr1Connect = await hardhatToken.connect(addr1);
      // step 3
      // const signature = await addr1Connect.signMessage(tokenId, amount, nonce)
      let signature = await addr1.signMessage(messageHashBinary);
      console.log("origin   ", addr1.address);
      console.log("recovered", ethers.utils.verifyMessage(messageHashBinary, signature));
      expect(ethers.utils.verifyMessage(messageHashBinary, signature) === addr1.address);
      await expect(
        addr1Connect.pay(tokenId, amount, nonce, signature)
      ).to.emit(hardhatToken, "TransferSingle")
        .withArgs(addr1.address, addr1.address, owner.address, tokenId, 20)
        .emit(hardhatToken, "LeftToken")
        .withArgs(addr1.address, tokenId, amount - 20);
      let minPrice = 5;
      // step 1
      // 66 byte string, which represents 32 bytes of data
      messageHash = ethers.utils.solidityKeccak256(
        ["address", "address", "uint256", "uint256", "uint256"],
        // 交换amount 和nonce 的顺序，从而故意让签名验证失败
        [addr1.address, hardhatToken.address, tokenId, nonce, minPrice]
      );
      // step 2
      // 32 bytes of data in Uint8Array
      messageHashBinary = ethers.utils.arrayify(messageHash);
      // step 3
      // const signature = await addr1Connect.signMessage(tokenId, amount, nonce)
      signature = await addr1.signMessage(messageHashBinary);
      await expect(
        addr1Connect.redeem(addr1.address, { tokenId, minPrice, signature }, nonce)
      ).to.be.revertedWith("Used nonce");
    });

    it("Should pay success with LeftToken event", async function() {
      const initialOwnerBalance = await hardhatToken.balanceOf(owner.address, tokenId);
      // Transfer 100 tokens from owner to addr1.
      // Check balances.
      await expect(hardhatToken.safeTransferFrom(owner.address, addr1.address, tokenId, 100, ethers.utils.formatBytes32String("event")))
        .to.emit(hardhatToken, "TransferSingle")
        .withArgs(owner.address, owner.address, addr1.address, tokenId, 100);
      const finalOwnerBalance = await hardhatToken.balanceOf(owner.address, tokenId);
      expect(finalOwnerBalance).to.equal(initialOwnerBalance.sub(100));
      const addr1Balance = await hardhatToken.balanceOf(addr1.address, tokenId);
      expect(addr1Balance).to.equal(100);
      const amount = 30;
      let nonce = new Date().valueOf();
      // https://github.com/ethers-io/ethers.js/issues/468
      // step 1
      // 66 byte string, which represents 32 bytes of data
      let messageHash = ethers.utils.solidityKeccak256(
        ["address", "address", "uint256", "uint256", "uint256"],
        [addr1.address, hardhatToken.address, tokenId, nonce, amount]
      );
      // step 2
      // 32 bytes of data in Uint8Array
      let messageHashBinary = ethers.utils.arrayify(messageHash);
      const addr1Connect = await hardhatToken.connect(addr1);
      // step 3
      // const signature = await addr1Connect.signMessage(tokenId, amount, nonce)
      let signature = await addr1.signMessage(messageHashBinary);
      console.log("origin   ", addr1.address);
      console.log("recovered", ethers.utils.verifyMessage(messageHashBinary, signature));
      expect(ethers.utils.verifyMessage(messageHashBinary, signature) === addr1.address);
      await expect(
        addr1Connect.pay(tokenId, amount, nonce, signature)
      ).to.emit(hardhatToken, "TransferSingle")
        .withArgs(addr1.address, addr1.address, owner.address, tokenId, 20)
        .to.emit(hardhatToken, "LeftToken")
        .withArgs(addr1.address, tokenId, 10);

      let minPrice = 2;
      ++nonce;
      // step 1
      // 66 byte string, which represents 32 bytes of data
      messageHash = ethers.utils.solidityKeccak256(
        ["address", "address", "uint256", "uint256", "uint256"],
        // 交换amount 和nonce 的顺序，从而故意让签名验证失败
        [addr1.address, hardhatToken.address, tokenId, nonce, minPrice]
      );
      // step 2
      // 32 bytes of data in Uint8Array
      messageHashBinary = ethers.utils.arrayify(messageHash);
      // step 3
      // const signature = await addr1Connect.signMessage(tokenId, amount, nonce)
      signature = await addr1.signMessage(messageHashBinary);
      await expect(
        addr1Connect.redeem(addr1.address, { tokenId, minPrice, signature }, nonce)
      ).to.be.revertedWith("ERC1155: caller is not owner nor approved");
      // 需要这个调用,否则不能赎回
      await hardhatToken.setApprovalForAll(addr1.address, true);
      expect(await addr1Connect.isApprovedForAll(owner.address, addr1.address)).to.equal(true);
      await expect(
        addr1Connect.redeem(addr1.address, { tokenId, minPrice, signature }, nonce)
      ).to.emit(hardhatToken, "Redeem")
        .withArgs(addr1.address, tokenId, 10 - minPrice);
    });
  });
});