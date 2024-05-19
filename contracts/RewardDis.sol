// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.11;
pragma experimental ABIEncoderV2;

import "./HederaTokenService.sol";
import "./HederaResponseCodes.sol";

contract RewardDistribution is HederaTokenService {
    address public mstTokenAddress;
    address public mptTokenAddress;
    address public treasuryAddress;

    mapping(address => uint64) public staked;
    mapping(address => uint64) public rewards;
    mapping(address => uint64) public lastUpdateTime;
    address[] public stakers;
    uint64 public totalStaked;
    uint64 public totalRewardPool;

    event Staked(address indexed user, uint64 amount);
    event Unstaked(address indexed user, uint64 amount);
    event RewardClaimed(address indexed user, uint64 reward);
    event RewardAdded(uint64 amount);
    event TransactionProcessed(address indexed sender, uint64 amount);

    constructor(address _mstTokenAddress, address _mptTokenAddress, address _treasuryAddress) {
        mstTokenAddress = _mstTokenAddress;
        mptTokenAddress = _mptTokenAddress;
        treasuryAddress = _treasuryAddress;
    }

    function stakeTokens(uint64 amount) external {
        int response = HederaTokenService.transferToken(mstTokenAddress, msg.sender, address(this), int64(amount));
        if (response != HederaResponseCodes.SUCCESS) {
            revert("Stake Failed");
        }
        updateReward(msg.sender);
        if (staked[msg.sender] == 0) {
            stakers.push(msg.sender);
        }
        staked[msg.sender] += amount;
        totalStaked += amount;
        lastUpdateTime[msg.sender] = uint64(block.timestamp);
        emit Staked(msg.sender, amount);
    }

    function unstakeTokens(uint64 amount) external {
        require(staked[msg.sender] >= amount, "Cannot unstake more than staked amount");
        updateReward(msg.sender);
        staked[msg.sender] -= amount;
        totalStaked -= amount;
        int response = HederaTokenService.transferToken(mstTokenAddress, address(this), msg.sender, int64(amount));
        if (response != HederaResponseCodes.SUCCESS) {
            revert("Unstake Failed");
        }
        if (staked[msg.sender] == 0) {
            for (uint64 i = 0; i < stakers.length; i++) {
                if (stakers[i] == msg.sender) {
                    stakers[i] = stakers[stakers.length - 1];
                    stakers.pop();
                    break;
                }
            }
        }
        lastUpdateTime[msg.sender] = uint64(block.timestamp);
        emit Unstaked(msg.sender, amount);
    }

    function claimRewards() external {
        updateReward(msg.sender);
        uint64 reward = rewards[msg.sender];
        rewards[msg.sender] = 0;
        int response = HederaTokenService.transferToken(mptTokenAddress, treasuryAddress, msg.sender, int64(reward));
        if (response != HederaResponseCodes.SUCCESS) {
            revert("Claim Rewards Failed");
        }
        emit RewardClaimed(msg.sender, reward);
    }

    function updateReward(address user) internal {
        if (staked[user] > 0) {
            uint256 rewardDelta = (uint256(staked[user]) * (block.timestamp - lastUpdateTime[user]) * totalRewardPool) / totalStaked / 1 days;
            rewards[user] += uint64(rewardDelta);
        }
        lastUpdateTime[user] = uint64(block.timestamp);
    }

    function addReward(uint64 amount) internal {
        int response = HederaTokenService.transferToken(mptTokenAddress, treasuryAddress, address(this), int64(amount));
        if (response != HederaResponseCodes.SUCCESS) {
            revert("Add Reward Failed");
        }
        totalRewardPool += amount;
        emit RewardAdded(amount);
    }

    function distributeRewards() external {
        for (uint64 i = 0; i < stakers.length; i++) {
            updateReward(stakers[i]);
        }
    }

    function processTransaction(uint64 amount, address recipient) external {
        int response = HederaTokenService.transferToken(mptTokenAddress, msg.sender, recipient, int64(amount));
        if (response != HederaResponseCodes.SUCCESS) {
            revert("Transaction Failed");
        }
        emit TransactionProcessed(msg.sender, amount);
    }

    function mintTokens(address token, uint64 amount) external {
        bytes[] memory data = new bytes[](1);
        data[0] = new bytes(amount);
        (int response, , ) = HederaTokenService.mintToken(token, int64(amount), data);
        if (response != HederaResponseCodes.SUCCESS) {
            revert("Mint Failed");
        }
    }

    function tokenAssociate(address user, address[] memory tokens) external {
        for (uint64 i = 0; i < tokens.length; i++) {
            int response = HederaTokenService.associateToken(user, tokens[i]);
            if (response != HederaResponseCodes.SUCCESS) {
                revert("Associate Failed");
            }
        }
    }
}
