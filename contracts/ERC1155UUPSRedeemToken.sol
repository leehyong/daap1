pragma solidity ^0.8.0;

import './ERC1155UUPSPaymentToken.sol';

contract ERC1155UUPSRedeemToken is ERC1155UUPSPaymentToken {

    struct NFTVoucher {
        uint256 tokenId; // The token id to be redeemed
        uint256 minPrice; // The min price the caller has to pay in order to redeem bytes signature; // The typed signature generated beforehand
        bytes signature; // The typed signature generated beforehand
    }

    //赎回事件
    event Redeem(address indexed account, uint256 tokenId, uint256 amount);

    function redeem(address redeemer, NFTVoucher calldata voucher, uint256 nonce) public payable{
        // 验证签名正确性
        require(isValidSignature(voucher.tokenId, voucher.minPrice, nonce, voucher.signature), "Invalid signature");
        require(leftTokens[voucher.tokenId][_msgSender()] > voucher.minPrice);
    }

}
