// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

contract RewardDistribution {
    mapping(address => uint256) public staked;
    mapping(address => uint256) public rewards;
    mapping(address => uint256) public lastUpdateTime;
    address[] public stakers;
    uint256 public totalStaked;
    uint256 public totalRewardPool;
    address public mstTokenAddress;
    address public mptTokenAddress;
    address public feeRecipient;
    uint256 public feePercentage; // Add feePercentage state variable

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 reward);
    event RewardAdded(uint256 amount);
    event TransactionProcessed(address indexed sender, uint256 amount, uint256 fee);

    constructor(address _mstTokenAddress, address _mptTokenAddress, address _feeRecipient, uint256 _feePercentage) {
        mstTokenAddress = _mstTokenAddress;
        mptTokenAddress = _mptTokenAddress;
        feeRecipient = _feeRecipient;
        feePercentage = _feePercentage; // Set feePercentage in constructor
    }

    function stakeTokens(uint256 amount) public {
        require(IERC20(mstTokenAddress).transferFrom(msg.sender, address(this), amount), "Transfer failed");
        updateReward(msg.sender);
        if (staked[msg.sender] == 0) {
            stakers.push(msg.sender);
        }
        staked[msg.sender] += amount;
        totalStaked += amount;
        lastUpdateTime[msg.sender] = block.timestamp;
        emit Staked(msg.sender, amount);
    }

    function unstakeTokens(uint256 amount) public {
        require(staked[msg.sender] >= amount, "Cannot unstake more than staked amount");
        updateReward(msg.sender);
        staked[msg.sender] -= amount;
        totalStaked -= amount;
        require(IERC20(mstTokenAddress).transfer(msg.sender, amount), "Transfer failed");
        if (staked[msg.sender] == 0) {
            for (uint256 i = 0; i < stakers.length; i++) {
                if (stakers[i] == msg.sender) {
                    stakers[i] = stakers[stakers.length - 1];
                    stakers.pop();
                    break;
                }
            }
        }
        lastUpdateTime[msg.sender] = block.timestamp;
        emit Unstaked(msg.sender, amount);
    }

    function claimRewards() public {
        updateReward(msg.sender);
        uint256 reward = rewards[msg.sender];
        rewards[msg.sender] = 0;
        require(IERC20(mptTokenAddress).transfer(msg.sender, reward), "Transfer failed");
        emit RewardClaimed(msg.sender, reward);
    }

    function updateReward(address user) internal {
        if (staked[user] > 0) {
            rewards[user] += (staked[user] * (block.timestamp - lastUpdateTime[user]) * totalRewardPool) / totalStaked / 1 days;
        }
        lastUpdateTime[user] = block.timestamp;
    }

    function addReward(uint256 amount) public {
        require(IERC20(mptTokenAddress).transferFrom(feeRecipient, address(this), amount), "Transfer failed");
        totalRewardPool += amount;
        emit RewardAdded(amount);
    }

    function distributeRewards() public {
        for (uint256 i = 0; i < stakers.length; i++) {
            updateReward(stakers[i]);
        }
    }

    function processTransaction(uint256 amount, address recipient) public {
        uint256 fee = (amount * feePercentage) / 10000;
        uint256 amountAfterFee = amount - fee;
        require(IERC20(mptTokenAddress).transferFrom(msg.sender, feeRecipient, fee), "Fee transfer failed");
        addReward(fee);
        require(IERC20(mptTokenAddress).transferFrom(msg.sender, recipient, amountAfterFee), "Transfer failed");
        emit TransactionProcessed(msg.sender, amount, fee);
    }
}
