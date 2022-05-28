pragma solidity ^0.8.0;

import './ERC1155UUPSPaymentToken.sol';

contract ERC1155UUPSPaymentRedeemToken is ERC1155UUPSPaymentToken {

    struct NFTVoucher {
        uint256 tokenId; // The token id to be redeemed
        uint256 minPrice; // The min price the caller has to pay in order to redeem bytes signature; // The typed signature generated beforehand
        bytes signature; // The typed signature generated beforehand
    }



    //赎回事件
    event Redeem(address indexed account, uint256 tokenId, uint256 amount);

    // 赎回函数
    function redeem(address redeemer, NFTVoucher calldata voucher, uint256 nonce) public payable {
        // 验证签名正确性
        require(redeemer == _msgSender(), "Invalid redeemer");
        require(isValidSignature(redeemer, voucher.tokenId, voucher.minPrice, nonce, voucher.signature), "Invalid signature");
        require(!usedNonce[nonce], "Used nonce");
        require(leftTokens[voucher.tokenId][_msgSender()] > voucher.minPrice, "Not enough left-token!");
        uint256 redeemAmount = leftTokens[voucher.tokenId][_msgSender()] - voucher.minPrice;
        // 把剩余的token 回退给 _msgSender()
        _safeTransferFrom(leftTokenAddress, _msgSender(), voucher.tokenId, redeemAmount, _msgData());
        // 归零
        leftTokens[voucher.tokenId][_msgSender()] = 0;
        usedNonce[nonce] = true;
        // 触发赎回事件
        emit Redeem(_msgSender(), voucher.tokenId, redeemAmount);
    }


}
