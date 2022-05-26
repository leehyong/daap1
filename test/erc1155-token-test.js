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
    // Token = await ethers.getContractFactory("ERC1155UUPSToken");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    // To deploy our contract, we just have to call Token.deploy() and await
    // for it to be deployed(), which happens once its transaction has been
    // mined.
    hardhatToken = await upgrades.deployProxy(Token, { kind: "uups" });
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
    it("Should transfer tokens between accounts", async function() {
      // Transfer 50 tokens from owner to addr1
      await hardhatToken.safeTransferFrom(owner.address, addr1.address, tokenId, 50, ethers.utils.formatBytes32String("50"));
      const addr1Balance = await hardhatToken.balanceOf(addr1.address, tokenId);
      expect(addr1Balance).to.equal(50);

      // Transfer 50 tokens from addr1 to addr2
      // We use .connect(signer) to send a transaction from another account
      await hardhatToken.connect(addr1).safeTransferFrom(addr1.address, addr2.address, tokenId, 50, ethers.utils.formatBytes32String("50"));
      const addr2Balance = await hardhatToken.balanceOf(addr2.address, tokenId);
      expect(addr2Balance).to.equal(50);
    });

    it("Should fail if sender doesn’t have enough tokens", async function() {
      const initialOwnerBalance = await hardhatToken.balanceOf(owner.address, tokenId);

      // Try to send 1 token from addr1 (0 tokens) to owner (1000000 tokens).
      // `require` will evaluate false and revert the transaction.
      await expect(
        hardhatToken.connect(addr1).safeTransferFrom(addr1.address, owner.address, tokenId, 1, ethers.utils.formatBytes32String("error"))
      ).to.be.revertedWith("ERC1155: insufficient balance for transfer");

      // Owner balance shouldn't have changed.
      expect(await hardhatToken.balanceOf(owner.address, tokenId)).to.equal(
        initialOwnerBalance
      );
    });

    it("Should update balances after transfers", async function() {
      const initialOwnerBalance = await hardhatToken.balanceOf(owner.address, tokenId);

      // Transfer 100 tokens from owner to addr1.
      await hardhatToken.safeTransferFrom(owner.address, addr1.address, tokenId, 100, ethers.utils.formatBytes32String("addr1"));

      // Transfer another 50 tokens from owner to addr2.
      await hardhatToken.safeTransferFrom(owner.address, addr2.address, tokenId, 50, ethers.utils.formatBytes32String("add2"));

      // Check balances.
      const finalOwnerBalance = await hardhatToken.balanceOf(owner.address, tokenId);
      expect(finalOwnerBalance).to.equal(initialOwnerBalance.sub(150));

      const addr1Balance = await hardhatToken.balanceOf(addr1.address, tokenId);
      expect(addr1Balance).to.equal(100);

      const addr2Balance = await hardhatToken.balanceOf(addr2.address, tokenId);
      expect(addr2Balance).to.equal(50);
    });

    it("Should emit Transfer event", async function() {
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
    });


    it("Should pay success", async function() {
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
      const amount = 20;
      const nonce = new Date().valueOf();
      // https://github.com/ethers-io/ethers.js/issues/468
      // step 1
      // 66 byte string, which represents 32 bytes of data
      const messageHash = ethers.utils.solidityKeccak256(
        ["address", "address", "uint256", "uint256", "uint256"],
        [addr1.address, hardhatToken.address, tokenId, nonce, amount]
      );
      // step 2
      // 32 bytes of data in Uint8Array
      let messageHashBinary = ethers.utils.arrayify(messageHash);
      const addr1Connect = await hardhatToken.connect(addr1);
      // step 3
      // const signature = await addr1Connect.signMessage(tokenId, amount, nonce)
      const signature = await addr1.signMessage(messageHashBinary);
      console.log("origin   ", addr1.address);
      console.log("recovered", ethers.utils.verifyMessage(messageHashBinary, signature));
      expect(ethers.utils.verifyMessage(messageHashBinary, signature) === addr1.address)
      await expect(
        addr1Connect.pay(tokenId, amount, nonce, signature)
      ).to.emit(hardhatToken, "TransferSingle")
        .withArgs(addr1.address, addr1.address, owner.address, tokenId, 20);
    });

    it("Reverted Invalid signature", async function() {
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
      const amount = 20;
      const nonce = new Date().valueOf();
      // https://github.com/ethers-io/ethers.js/issues/468
      // step 1
      // 66 byte string, which represents 32 bytes of data
      const messageHash = ethers.utils.solidityKeccak256(
        ["address", "address", "uint256", "uint256", "uint256"],
        // 交换amount 和nonce 的顺序，从而故意让签名验证失败
        [addr1.address, hardhatToken.address, tokenId, amount, nonce]
      );
      // step 2
      // 32 bytes of data in Uint8Array
      let messageHashBinary = ethers.utils.arrayify(messageHash);
      const addr1Connect = await hardhatToken.connect(addr1);
      // step 3
      // const signature = await addr1Connect.signMessage(tokenId, amount, nonce)
      const signature = await addr1.signMessage(messageHashBinary);
      console.log("origin   ", addr1.address);
      console.log("recovered", ethers.utils.verifyMessage(messageHashBinary, signature));
      expect(ethers.utils.verifyMessage(messageHashBinary, signature) === addr1.address)
      await expect(
        addr1Connect.pay(tokenId, amount, nonce, signature)
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
      let amount = 20;
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
      expect(ethers.utils.verifyMessage(messageHashBinary, signature) === addr1.address)
      await expect(
        addr1Connect.pay(tokenId, amount, nonce, signature)
      ).to.emit(hardhatToken, "TransferSingle")
        .withArgs(addr1.address, addr1.address, owner.address, tokenId, 20);
      amount = 30;
      // step 1
      // 66 byte string, which represents 32 bytes of data
      messageHash = ethers.utils.solidityKeccak256(
        ["address", "address", "uint256", "uint256", "uint256"],
        // 交换amount 和nonce 的顺序，从而故意让签名验证失败
        [addr1.address, hardhatToken.address, tokenId, nonce, amount]
      );
      // step 2
      // 32 bytes of data in Uint8Array
      messageHashBinary = ethers.utils.arrayify(messageHash);
      // step 3
      // const signature = await addr1Connect.signMessage(tokenId, amount, nonce)
      signature = await addr1.signMessage(messageHashBinary);
      await expect(
        addr1Connect.pay(tokenId, amount, nonce, signature)
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
      const nonce = new Date().valueOf();
      // https://github.com/ethers-io/ethers.js/issues/468
      // step 1
      // 66 byte string, which represents 32 bytes of data
      const messageHash = ethers.utils.solidityKeccak256(
        ["address", "address", "uint256", "uint256", "uint256"],
        [addr1.address, hardhatToken.address, tokenId, nonce, amount]
      );
      // step 2
      // 32 bytes of data in Uint8Array
      let messageHashBinary = ethers.utils.arrayify(messageHash);
      const addr1Connect = await hardhatToken.connect(addr1);
      // step 3
      // const signature = await addr1Connect.signMessage(tokenId, amount, nonce)
      const signature = await addr1.signMessage(messageHashBinary);
      console.log("origin   ", addr1.address);
      console.log("recovered", ethers.utils.verifyMessage(messageHashBinary, signature));
      expect(ethers.utils.verifyMessage(messageHashBinary, signature) === addr1.address)
      await expect(
        addr1Connect.pay(tokenId, amount, nonce, signature)
      ).to.emit(hardhatToken, "TransferSingle")
        .withArgs(addr1.address, addr1.address, owner.address, tokenId, 20)
        .to.emit(hardhatToken, "LeftToken")
        .withArgs(addr1.address, tokenId, 10)
    });
  });
});