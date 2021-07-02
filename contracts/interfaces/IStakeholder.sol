// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

interface IStakeholder {

    struct StakeholderSummary{
        address stakeholder;
        uint256 stake;
    }

    function updateStakeholdersLimit() external returns(bool result);

    function isStakeholder(address target) external view returns(bool result);

    function totalStakeholders() external view returns(uint256);

    function stakeholdersLimit() external view returns(uint256);

    function nextStakeholdersLimit() external view returns(uint256);

    function stakeholders() external view returns (StakeholderSummary[] memory);

    function worstStakeholder() external view returns(address, uint256);

    function getNextStakeholder(address target) external view returns(address);
    
}
