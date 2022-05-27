pragma solidity ^0.8.0;

import "./ERC1155UUPSPaymentRedeemToken.sol";
import "./BatchPay.sol";

contract ERC1155UUPSBatchPaymentRedeemToken is ERC1155UUPSPaymentRedeemToken {
    using BatchPay for *;
    event LeftTokenBatch(address indexed account, uint256[] tokenIds, uint256[] amounts);
    // 批量支付
    function batchPay(BatchPay.PayInfo calldata info) external {
        require(info.tokenIds.length == info.amounts.length, "Unmatched length");
        require(info.isValidSignatureBatchPay(), "Invalid signer signature");
        safeBatchTransferFrom(_msgSender(), owner(), info.tokenIds, info.amounts, _msgData());
//        (uint256[] memory _ids, uint256[] memory _amounts, bool isEmit) = leftTokens.handlesLeftToken(info.tokenIds, info.amounts, assetValue);
//        if (isEmit) {
//            emit    LeftTokenBatch(_msgSender(), _ids, _amounts);
//        }
    }
}
