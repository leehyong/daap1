pragma solidity ^0.8.0;
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

library BatchPay {
    struct PayInfo {
        address to;
        uint256[] tokenIds;
        uint256[] amounts;
        bytes signature;
        uint256 nonce;
    }

    using ECDSA for bytes32;
    function isValidSignatureBatchPay(PayInfo calldata info) external view returns (bool) {
        bytes memory encoded = abi.encodePacked(info.to, address(this), info.nonce);
        for (uint i = 0; i < info.amounts.length; i++) {
            encoded = bytes .concat(encoded, abi.encodePacked(info.tokenIds[i], info.amounts[i]));
        }
        return keccak256(encoded).toEthSignedMessageHash().recover(info.signature) == msg.sender;
    }

    /*
    function handlesLeftToken(
        mapping(uint256 => mapping(address => uint256))storage leftTokens,
        uint256[]memory ids, uint256[]memory amounts,
        uint256 assetValue)
    public returns (uint256[]memory, uint256[]memory, bool) {
//    public returns (bool) {
        bool isEmit = false;
        for (uint i = 0; i < ids.length; i++) {
            // 更新剩余的token
            uint256 left = amounts[i] - assetValue;
            leftTokens[ids[i]][msg.sender] += left;
            amounts[i] = left;
            if (left > 0) {
                //                _tokenIds = string(abi.encodePacked(_tokenIds, ",", ids[i]));
                //                _amounts = string(abi.encodePacked(_amounts, ",", left));
                isEmit = true;
            }
        }
//        return isEmit;
        return (ids, amounts, isEmit);
    }
    */
}
