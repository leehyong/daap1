// Solidity files have to start with this pragma.
// It will be used by the Solidity compiler to validate its version.
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
// This is the main building block for smart contracts.
contract Token2 is Initializable{
    // Some string type variables to identify the token.
    // The `public` modifier makes a variable readable from outside the contract.
    string public name;
    string public symbol;

    // The fixed amount of tokens stored in an unsigned integer type variable.
    uint256 public totalSupply;

    // An address type variable is used to store ethereum accounts.
    address public owner;

    // A mapping is a key/value map. Here we store each account balance.
    mapping(address => uint256) balances;


    event Transfer(address indexed from, address indexed to, uint256 amount);

    /**
     * Contract initialization.
     *
     * The `constructor` is executed only once when the contract is created.
     */

    function initialize() public initializer {
        name = "Lhy  Token";
        symbol = "LT";
        totalSupply = 10000000;
        // The totalSupply is assigned to transaction sender, which is the account
        // that is deploying the contract.
        owner = msg.sender;
        balances[owner] = totalSupply;
    }

    /**
     * A function to transfer tokens.
     *
     * The `external` modifier makes a function *only* callable from outside
     * the contract.
     */
    function transfer(address to, uint256 amount) external {
        // Check if the transaction sender has enough tokens.
        // If `require`'s first argument evaluates to `false` then the
        // transaction will revert.
        require(amount <= totalSupply, "Not enough total tokens");
        require(balances[msg.sender] >= amount, "Not enough tokens");

        // Transfer the amount.
        balances[msg.sender] -= amount;
        balances[to] += amount;
        emit Transfer(msg.sender, to, amount);
    }



    /**
     * Read only function to retrieve the token balance of a given account.
     *
     * The `view` modifier indicates that it doesn't modify the contract's
     * state, which allows us to call it without executing a transaction.
     */
    function balanceOf(address account) external view returns (uint256) {
        return balances[account];
    }
}

