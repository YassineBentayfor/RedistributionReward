// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.17;
pragma experimental ABIEncoderV2;

import "./HederaTokenService.sol";
import "./HederaResponseCodes.sol";

contract RewardDistribution is HederaTokenService {
    address public mstTokenAddress;
    address public mptTokenAddress;
    address public treasuryAddress;

    mapping(address => uint64) public staked;
    mapping(address => uint64) public rewards;
    mapping(address => uint64) public userRewardPerTokenPaid;
    uint64 public totalStaked;
    uint64 public rewardPerTokenStored;
    uint64 public lastUpdateTime;

    uint64 public constant REWARD_RATE = 100;

    event Staked(address indexed user, uint64 amount);
    event Unstaked(address indexed user, uint64 amount);
    event RewardClaimed(address indexed user, uint64 reward);
    event RewardAdded(uint64 amount);
    event MstTokensTransferred(address indexed sender, uint64 amount, address recipient);
    event MptTokensTransferred(address indexed sender, uint64 amount, address recipient);
    event MintMptToken(address indexed minter, uint64 amount);
    event MintMstToken(address indexed minter, uint64 amount);

    constructor(address _mstTokenAddress, address _mptTokenAddress, address _treasuryAddress) {
        mstTokenAddress = _mstTokenAddress;
        mptTokenAddress = _mptTokenAddress;
        treasuryAddress = _treasuryAddress;
    }

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = uint64(block.timestamp);
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    modifier moreThanZero(uint64 amount) {
        require(amount > 0, "Amount must be greater than zero");
        _;
    }

    
            function rewardPerToken() public view returns (uint64) {
                if (totalStaked == 0) {
                    return rewardPerTokenStored;
                } else {
                    return rewardPerTokenStored + ((uint64(block.timestamp - lastUpdateTime) * REWARD_RATE * 1e18) / totalStaked);
                }
            }
        
    

    
        function earned(address account) public view returns (uint64) {
            return (staked[account] * (rewardPerToken() - userRewardPerTokenPaid[account])) / 1e18 + rewards[account];
        }
    

    function stakeTokens(uint64 amount) external updateReward(msg.sender) moreThanZero(amount) {
        int response = HederaTokenService.transferToken(mstTokenAddress, msg.sender, address(this), int64(amount));
        if (response != HederaResponseCodes.SUCCESS) {
            revert("Stake Failed");
        }
        staked[msg.sender] += amount;
        totalStaked += amount;
        emit Staked(msg.sender, amount);
    }

    function unstakeTokens(uint64 amount) external updateReward(msg.sender) moreThanZero(amount) {
        require(staked[msg.sender] >= amount, "Cannot unstake more than staked amount");
        staked[msg.sender] -= amount;
        totalStaked -= amount;
        int response = HederaTokenService.transferToken(mstTokenAddress, address(this), msg.sender, int64(amount));
        if (response != HederaResponseCodes.SUCCESS) {
            revert("Unstake Failed");
        }
        emit Unstaked(msg.sender, amount);
    }

    function claimRewards() external updateReward(msg.sender) {
        uint64 reward = rewards[msg.sender];
        rewards[msg.sender] = 0;
        int response = HederaTokenService.transferToken(mptTokenAddress, treasuryAddress, msg.sender, int64(reward));
        if (response != HederaResponseCodes.SUCCESS) {
            revert("Claim Rewards Failed");
        }
        emit RewardClaimed(msg.sender, reward);
    }

    function addReward(uint64 amount) external {
        int response = HederaTokenService.transferToken(mptTokenAddress, msg.sender, address(this), int64(amount));
        if (response != HederaResponseCodes.SUCCESS) {
            revert("Add Reward Failed");
        }
        emit RewardAdded(amount);
    }

    function mintMptToken(uint64 amount) external {
        bytes[] memory data = new bytes[](1);
        data[0] = new bytes(amount);
        (int response, , ) = HederaTokenService.mintToken(mptTokenAddress, int64(amount), data);
        if (response != HederaResponseCodes.SUCCESS) {
            revert("Mint MPT Token Failed");
        }
        emit MintMptToken(msg.sender, amount);
    }

    function mintMstToken(uint64 amount) external {
        bytes[] memory data = new bytes[](1);
        data[0] = new bytes(amount);
        (int response, , ) = HederaTokenService.mintToken(mstTokenAddress, int64(amount), data);
        if (response != HederaResponseCodes.SUCCESS) {
            revert("Mint MST Token Failed");
        }
        emit MintMstToken(msg.sender, amount);
    }

    function transferMstTokens(uint64 amount, address recipient) external {
        int response = HederaTokenService.transferToken(mstTokenAddress, msg.sender, recipient, int64(amount));
        if (response != HederaResponseCodes.SUCCESS) {
            revert("MST Token Transfer Failed");
        }
        emit MstTokensTransferred(msg.sender, amount, recipient);
    }

    function transferMptTokens(uint64 amount, address recipient) external {
        int response = HederaTokenService.transferToken(mptTokenAddress, msg.sender, recipient, int64(amount));
        if (response != HederaResponseCodes.SUCCESS) {
            revert("MPT Token Transfer Failed");
        }
        emit MptTokensTransferred(msg.sender, amount, recipient);
    }

    function associateMSTToken(address user) external {
        int response = HederaTokenService.associateToken(user, mstTokenAddress);
        if (response != HederaResponseCodes.SUCCESS) {
            revert("Associate MST Token Failed");
        }
    }

    function associateMPTToken(address user) external {
        int response = HederaTokenService.associateToken(user, mptTokenAddress);
        if (response != HederaResponseCodes.SUCCESS) {
            revert("Associate MPT Token Failed");
        }
    }
}
