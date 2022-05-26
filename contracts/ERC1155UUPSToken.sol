// Solidity files have to start with this pragma.
// It will be used by the Solidity compiler to validate its version.
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

// This is the main building block for smart contracts.
contract ERC1155UUPSToken is ERC1155Upgradeable, UUPSUpgradeable, OwnableUpgradeable {
    // Some string type variables to identify the token.
    // The `public` modifier makes a variable readable from outside the contract.
    // The fixed amount of tokens stored in an unsigned integer type variable.
    uint256 public constant totalSupply2 = 10000000;
    uint256 public constant Rock = 1;
    uint256 public constant Paper = 2;
    uint256 public constant Scissors = 3;
//    event re(address indexed from, address indexed to, uint256 amount);
//    event transferred(address indexed from, address indexed to, uint256 amount);

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
