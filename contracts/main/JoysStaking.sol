// SPDX-License-Identifier: MIT
// solhint-disable not-rely-on-time, reason-string, no-inline-assembly

pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/IJoysStaking.sol";
import "./Stakeholder.sol";

/**
 * @dev Main staking contract
 */
contract JoysStaking is IJoysStaking, Stakeholder, ReentrancyGuard {

    event Deposit(address indexed user, uint256 value, uint256 timestamp);
    event Withdraw(address indexed user, uint256 value, uint256 timestamp);
    event Drop(address indexed from, address indexed to, uint256 value, uint256 timestamp);
    event EmergencyClosePosition(address indexed owner, address indexed target, uint256 value, uint256 timestamp);

    event Receive(address indexed from, uint256 value, uint256 timestamp);

    event Transfer(address indexed target, uint256 value, uint256 timestamp);

    uint256 internal _minimalStake;

    /**
     * @param newMinimalStake minimum bet limit, cannot be changed
     * @param newStartedStakeholdersLimit initial stakeholder limit
     * @param newNextStakeholdersLimit stakeholder limit after update
     * @param newVault address of the deployed Vault contract
     */
    constructor(uint256 newMinimalStake, uint256 newStartedStakeholdersLimit, uint256 newNextStakeholdersLimit, address newVault) public nonReentrant {
        require(newMinimalStake > 0, "JoysStaking: 'newMinimalStake' arg error");
        require(newStartedStakeholdersLimit > 0, "JoysStaking: 'newStartedStakeholdersLimit' arg error");
        require(newNextStakeholdersLimit > 0, "JoysStaking: 'newNextStakeholdersLimit' arg error");
        
        uint256 codeSize;
        assembly {
            codeSize := extcodesize(newVault)
        }
        require(codeSize > 0, "JoysStaking: 'vault' must be contract");

        _minimalStake = newMinimalStake;
        _stakeholdersLimit = newStartedStakeholdersLimit;
        _nextStakeholdersLimit = newNextStakeholdersLimit;
        _vault = newVault;
    }

    receive() external payable {
        emit Receive(msg.sender, msg.value, block.timestamp);
    }

    /**
     * @dev Sends native currency to increase staking deposit.
     * The total amount of position must be greater than the minimum limit.
     * If stakeholder limit is exceeded, need to outbid stake of the worst stakeholder.
     * @return success
     */
    function deposit() external payable nonReentrant override returns (bool success) {
        require(msg.value > 0, "JoysStaking: value must not be zero");

        _recalculateStaker(msg.sender);

        emit Deposit(msg.sender, msg.value, block.timestamp);

        if (_isStakeholder(msg.sender)) {
            _increaseStakeholder(msg.sender, msg.value);
            return true;
        }
        
        require(msg.value >= _minimalStake, "JoysStaking: amount in staking must be greater than fixed minimum");
        if (_totalStakeholders() < _stakeholdersLimit) {
            _addStakeholder(msg.sender, msg.value);
        } else {
            (address w0rstStakeholder, uint256 worstStake) = _worstStakeholder();
            if (msg.value > worstStake) {
                _recalculateStaker(w0rstStakeholder);
                _addStakeholder(msg.sender, msg.value);
                uint256 removedStake = _removeStakeholder(w0rstStakeholder);
                _transfer(payable(w0rstStakeholder), removedStake);

                emit Drop(msg.sender, w0rstStakeholder, worstStake, block.timestamp);
            } else {
                revert("JoysStaking: stakepool is full. Your stake must be higher than of the worst staker");
            }
        }

        return true;
    }

    /**
     * @dev Decreases staking deposit.
     * If the final deposit becomes less than the minimum, the position will be completely closed
     * @return success
     */
    function withdraw(uint256 amount) external nonReentrant override returns (bool success) {
        require(amount > 0, "JoysStaking: amount must not be zero");
        require(_isStakeholder(msg.sender), "JoysStaking: user must be a stakeholder");

        _recalculateStaker(msg.sender);

        uint256 userStake = _clearStakeOf(msg.sender);
        uint256 removedStake;
        if (userStake.sub(amount, "JoysStaking: amount is greater than real stake") >= _minimalStake) {
            removedStake = amount;
            _decreaseStakeholder(msg.sender, amount);
            _transfer(msg.sender, amount);
        } else {
            removedStake = _removeStakeholder(msg.sender);
            _transfer(msg.sender, removedStake);
        }

        emit Withdraw(msg.sender, removedStake, block.timestamp);

        return true;
    }

    /**
     * @dev Closes position.
     * Only for admins.
     * @return success
     */
    function emergencyClosePosition(address payable target) external nonReentrant onlyOwner override returns(bool success) {
        require(_isStakeholder(target), "JoysStaking: target must be a stakeholder");

        _recalculateStaker(target);

        uint256 removedStake = _removeStakeholder(target);
        _transfer(target, removedStake);

        emit EmergencyClosePosition(owner(), target, removedStake, block.timestamp);

        return true;
    }

    function minimalStake() external view override returns (uint256) {
        return _minimalStake;
    }

    function _transfer(address payable target, uint256 amount) internal {
        target.transfer(amount);

        emit Transfer(target, amount, block.timestamp);   
    }

}
