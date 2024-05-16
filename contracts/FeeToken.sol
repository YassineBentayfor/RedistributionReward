// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IHederaTokenService {
    function transferToken(address token, address from, address to, uint256 amount) external returns (bool);
}

contract FeeToken {
    address public rewardPool;
    uint256 public feePercentage = 10; // 0.1% fee
    address public tokenAddress;

    event FeeTaken(address indexed from, address indexed to, uint256 amount, uint256 fee);
    event RewardPoolUpdated(address indexed previousPool, address indexed newPool);
    event FeePercentageUpdated(uint256 previousFee, uint256 newFee);

    constructor(address _tokenAddress, address _rewardPool) {
        tokenAddress = _tokenAddress;
        rewardPool = _rewardPool;
    }

    function setFeePercentage(uint256 _feePercentage) external {
        require(msg.sender == rewardPool, "Only reward pool can update fee");
        emit FeePercentageUpdated(feePercentage, _feePercentage);
        feePercentage = _feePercentage;
    }

    function setRewardPool(address _rewardPool) external {
        require(msg.sender == rewardPool, "Only current reward pool can update");
        emit RewardPoolUpdated(rewardPool, _rewardPool);
        rewardPool = _rewardPool;
    }

    function processTransaction(address sender, address recipient, uint256 amount) external {
        uint256 fee = (amount * feePercentage) / 10000;
        uint256 amountAfterFee = amount - fee;

        IHederaTokenService(tokenAddress).transferToken(tokenAddress, sender, rewardPool, fee);
        IHederaTokenService(tokenAddress).transferToken(tokenAddress, sender, recipient, amountAfterFee);

        emit FeeTaken(sender, recipient, amount, fee);
    }
}
