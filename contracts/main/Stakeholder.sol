// SPDX-License-Identifier: MIT
// solhint-disable not-rely-on-time, reason-string

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "./StakingMechanics.sol";
import "../utils/StakingOwnable.sol";

/**
 * @dev Stakeholder system contract
 */
abstract contract Stakeholder is StakingMechanics, StakingOwnable {

    struct StakeholderSummary{
        address stakeholder;
        uint256 stake;
    }

    mapping(address => bool) private __isStakeholder;
    mapping(address => address) private __nextStakeholder;
    address constant private GUARD = address(1);
    uint256 private __totalStakeholders = 0;

    uint256 internal _stakeholdersLimit;
    uint256 internal _nextStakeholdersLimit;

    event AddStakeholder(address indexed target, uint256 value, uint256 timestamp);
    event RemoveStakeholder(address indexed target, uint256 value, uint256 timestamp);
    event IncreaseStakeholder(address indexed target, uint256 value, uint256 timestamp);
    event DecreaseStakeholder(address indexed target, uint256 value, uint256 timestamp);

    constructor() internal {
        __nextStakeholder[GUARD] = GUARD;
    }

    function updateStakeholdersLimit() external onlyOwner returns(bool result) {
        require(_stakeholdersLimit != _nextStakeholdersLimit, "Stakeholder: stakeholders limit has already been updated");
        _stakeholdersLimit = _nextStakeholdersLimit;
        return true;
    }

    function isStakeholder(address target) external view returns(bool result) {
        return _isStakeholder(target);
    }

    function totalStakeholders() external view returns(uint256) {
        return _totalStakeholders();
    }

    function stakeholdersLimit() external view returns(uint256) {
        return _stakeholdersLimit;
    }

    function nextStakeholdersLimit() external view returns(uint256) {
        return _nextStakeholdersLimit;
    }

    function stakeholders()
        external
        view
        returns (StakeholderSummary[] memory)
    {
        StakeholderSummary[] memory result = new StakeholderSummary[](__totalStakeholders);

        address currentAddress = __nextStakeholder[GUARD];
        uint256 index = 0;
        while(currentAddress != GUARD) {
            result[index].stakeholder = currentAddress;
            result[index].stake = _stakeOf(currentAddress);
            currentAddress = __nextStakeholder[currentAddress];
            index = index.add(1);
        }

        return result;
    }

    function worstStakeholder() external view returns(address, uint256) {
        return _worstStakeholder();
    }

    function getNextStakeholder(address target) external view returns(address) {
        return __nextStakeholder[target];
    }

    function _addStakeholder(address target, uint256 value) internal {
        __addStakeholder(target, value);

        emit AddStakeholder(target, value, block.timestamp);
    }

    function _removeStakeholder(address target) internal returns(uint256 removedStake) {
        removedStake = __removeStakeholder(target);

        emit RemoveStakeholder(target, removedStake, block.timestamp);

        return removedStake;
    }

    function _increaseStakeholder(address target, uint256 value) internal
    {
        uint256 currentStake = __removeStakeholder(target);
        __addStakeholder(target, currentStake.add(value));

        emit IncreaseStakeholder(target, value, block.timestamp);
    }

    function _decreaseStakeholder(address target, uint256 value) internal
    {
        uint256 currentStake = __removeStakeholder(target);
        __addStakeholder(target, currentStake.sub(value));

        emit DecreaseStakeholder(target, value, block.timestamp);
    }

    function _isStakeholder(address target) internal view returns(bool result) {
        return __isStakeholder[target];
    }

    function _totalStakeholders() internal view returns(uint256) {
        return __totalStakeholders;
    }

    function _worstStakeholder() internal view returns(address, uint256) {
        address result = __nextStakeholder[GUARD];
        if (result == GUARD) return(address(0), 0);
        return (result, _stakeOf(result));
    }

    function __addStakeholder(address target, uint256 value) private {
        require(target != address(0));
        require(__nextStakeholder[target] == address(0));
        require(__isStakeholder[target] == false);
        require(value > 0);

        // add stakeholder
        _addStake(target, value);
        __isStakeholder[target] = true;
        __totalStakeholders = __totalStakeholders.add(1);

        // binding in a sorted list
        address prevStakeholder = __findIndex(value);
        __nextStakeholder[target] = __nextStakeholder[prevStakeholder];
        __nextStakeholder[prevStakeholder] = target;
    }

    function __removeStakeholder(address target) private returns(uint256 removedStake) {
        require(target != address(0));
        require(__nextStakeholder[target] != address(0));
        require(__isStakeholder[target] == true);

        // remove stakeholder
        removedStake = _clearStakeOf(target);
        _subStake(target, removedStake);
        __isStakeholder[target] = false;
        __totalStakeholders = __totalStakeholders.sub(1);

        // unbinding in a sorted list
        address prevStakeholder = __findPrevStakeholder(target);
        __nextStakeholder[prevStakeholder] = __nextStakeholder[target];
        __nextStakeholder[target] = address(0);

        return removedStake;
    }

    function __findIndex(uint256 newValue) private view returns(address) {
        address candidateAddress = GUARD;
        while(true) {
            if(__verifyIndex(candidateAddress, newValue, __nextStakeholder[candidateAddress])) {
                return candidateAddress;
            }
            candidateAddress = __nextStakeholder[candidateAddress];
        }
    }

    function __verifyIndex(address prevStakeholder, uint256 newValue, address nextStakeholder)
        private
        view
        returns(bool)
    {
        return (
            (prevStakeholder == GUARD || _stakeOf(prevStakeholder) <= newValue) &&
            (nextStakeholder == GUARD || newValue < _stakeOf(nextStakeholder))
        );
    }

    function __findPrevStakeholder(address target)
        private
        view
        returns(address)
    {
        address currentAddress = GUARD;
        while(__nextStakeholder[currentAddress] != GUARD) {
            if (__nextStakeholder[currentAddress] == target) {
                return currentAddress;
            }
            currentAddress = __nextStakeholder[currentAddress];
        }
        revert("Stakeholder: error __findPrevStakeholder");
    }
    
}
