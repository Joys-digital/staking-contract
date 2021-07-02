// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

interface IStakingMechanics {

    function stakeOf(address target) external view returns (uint256);

    function expectedReward(address target) external view returns (uint256);

    function rewardsOf(address target) external view returns (uint256);

    function clearStakeOf(address target) external view returns (uint256);

    function totalClearStake() external view returns (uint256);

    function rewardPerSecond() external view returns(uint256);

    function lastUpdateAt(address target) external view returns(uint256);

    function vault() external view returns(address);
}
