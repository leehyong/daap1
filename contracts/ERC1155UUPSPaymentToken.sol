// Solidity files have to start with this pragma.
// It will be used by the Solidity compiler to validate its version.
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

// This is the main building block for smart contracts.
contract ERC1155UUPSPaymentToken is ERC1155Upgradeable, UUPSUpgradeable, OwnableUpgradeable {
    // Some string type variables to identify the token.
    // The `public` modifier makes a variable readable from outside the contract.
    // The fixed amount of tokens stored in an unsigned integer type variable.
    uint256 public constant totalSupply2 = 10000000;
    uint256 public constant Rock = 1;
    uint256 public constant Paper = 2;
    uint256 public constant Scissors = 3;
    address internal leftTokenAddress;
    using ECDSA for bytes32;

    // 资产价值
    uint256 public constant assetValue = 20;
    //    event re(address indexed from, address indexed to, uint256 amount);
    //    event transferred(address indexed from, address indexed to, uint256 amount);
    mapping(uint256 => mapping(address => uint256)) internal leftTokens;
    mapping(uint256 => bool) usedNonce;
    // 账户支付之后，对应token还剩多少
    event LeftToken(address indexed account, uint256 tokenId, uint256 amount);

    /// builds a prefixed hash to mimic the behavior of eth_sign.
    function isValidSignature(address addr, uint256 tokenId, uint256 amount, uint256 nonce, bytes memory signature) internal view returns (bool) {
        address _contractAddress = address(this);
        bytes32 _data = keccak256(abi.encodePacked(addr, _contractAddress, tokenId, nonce, amount));
        return _data.toEthSignedMessageHash().recover(signature) == _msgSender();
    }

    function pay(address to, uint256 tokenId, uint256 amount, uint256 nonce, bytes memory signature) external {
        // 验证签名正确性
        require(isValidSignature(to, tokenId, amount, nonce, signature), "Invalid signature");
        // 保证 nonce 没被使用过
        require(!usedNonce[nonce], "Used nonce");
        require(amount >= assetValue);
        uint256 left = amount - assetValue;
        // 支付给 to
        safeTransferFrom(_msgSender(), to, tokenId, assetValue, _msgData());
        usedNonce[nonce] = true;
        // 余额 > 0， 才发送事件
        if (left > 0) {
            // 把剩下的 token 转到合约专用账户里
            safeTransferFrom(_msgSender(), leftTokenAddress, tokenId, left, _msgData());
            leftTokens[tokenId][_msgSender()] += left;
            emit LeftToken(_msgSender(), tokenId, left);
        }
    }
    /**
     * Contract initialization.
     *
     * The `constructor` is executed only once when the contract is created.
     */
    function initialize() public initializer {
        // The totalSupply2 is assigned to transaction sender, which is the account
        // that is deploying the contract.
        __ERC1155_init("https://ipfs.io/ipfs/bafybeihjjkwdrxxjnuwevlqtqmh3iegcadc32sio4wmo7bv2gbf34qs34a/{}.json");
        __UUPSUpgradeable_init();
        __Ownable_init();
        _mint(owner(), Rock, totalSupply2, "");
        _mint(owner(), Paper, totalSupply2, "");
        _mint(owner(), Scissors, totalSupply2, "");
        leftTokenAddress = address(uint160(uint(keccak256(abi.encodePacked(block.timestamp)))));
    }

    //    function _msgSender() internal view virtual returns (address){
    //        return msg.sender;
    //
    //    }
    //    function _msgData() internal view virtual returns (address){
    //        return msg.data;
    //    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(){
        _disableInitializers();
    }
    /**
     * A function to transfer tokens.
     *
     * The `external` modifier makes a function *only* callable from outside
     * the contract.
     */
}
