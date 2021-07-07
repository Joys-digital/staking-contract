// SPDX-License-Identifier: MIT
// solhint-disable not-rely-on-time, reason-string

pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "../main/Stakeholder.sol";

/**
 * @dev Stakeholder system contract
 */
contract StakeholderMock is Stakeholder {

    constructor(uint256 newStartedStakeholdersLimit, uint256 newNextStakeholdersLimit) public {
        _stakeholdersLimit = newStartedStakeholdersLimit;
        _nextStakeholdersLimit = newNextStakeholdersLimit;
    }

    function addStakeholder(address target, uint256 value) external {
        _addStakeholder(target, value);
    }

    function removeStakeholder(address target) external returns(uint256 removedStake) {
        return _removeStakeholder(target);
    }

    function increaseStakeholder(address target, uint256 value) external
    {
        _increaseStakeholder(target, value);
    }

    function decreaseStakeholder(address target, uint256 value) external
    {
        _decreaseStakeholder(target, value);
    }
}
