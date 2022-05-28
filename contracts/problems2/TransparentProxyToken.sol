pragma solidity ^0.8.0;

import "../problems1/Token.sol";

contract TransparentProxyToken is Token {
    function mint(address to, uint256 amount) external {
        // Only owner can mint coin
        require(msg.sender == owner);
        // Check if the transaction sender has enough tokens.
        // If `require`'s first argument evaluates to `false` then the
        // transaction will revert.
        require(amount <= totalSupply, "Not enough total tokens");
        require(balances[owner] >= amount, "Not enough tokens");

        // Transfer the amount.
        balances[owner] -= amount;
        balances[to] += amount;
        emit Transfer(msg.sender, to, amount);
    }
}
