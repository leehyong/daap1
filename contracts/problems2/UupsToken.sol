// Solidity files have to start with this pragma.
// It will be used by the Solidity compiler to validate its version.
pragma solidity ^0.8.0;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

// This is the main building block for smart contracts.
contract UupsToken is Initializable, ERC20Upgradeable, UUPSUpgradeable, OwnableUpgradeable {
    // Some string type variables to identify the token.
    // The `public` modifier makes a variable readable from outside the contract.
    // The fixed amount of tokens stored in an unsigned integer type variable.
    uint256 public totalSupply2;

    event minted(address indexed from, address indexed to, uint256 amount);
    event transferred(address indexed from, address indexed to, uint256 amount);

    /**
     * Contract initialization.
     *
     * The `constructor` is executed only once when the contract is created.
     */
    function initialize() public initializer {
        // The totalSupply2 is assigned to transaction sender, which is the account
        // that is deploying the contract.
        totalSupply2 = 10000000;
        __ERC20_init("Lhy UUPS Token", "LT");
        __Ownable_init();
        __UUPSUpgradeable_init();
        _mint(owner(), totalSupply2);
    }
    function _authorizeUpgrade(address) internal override onlyOwner {}

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    /**
     * A function to transfer tokens.
     *
     * The `external` modifier makes a function *only* callable from outside
     * the contract.
     */

}
