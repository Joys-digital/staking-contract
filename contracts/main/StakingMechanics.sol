// SPDX-License-Identifier: MIT
// solhint-disable not-rely-on-time, reason-string

pragma solidity ^0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "../interfaces/IStakingMechanics.sol";
import "../interfaces/IVault.sol";

/**
 * @dev Staking mechanics contract
 */
abstract contract StakingMechanics is IStakingMechanics {
    using SafeMath for uint256;

    uint256 private __totalClearStake;
    mapping(address => uint256) private __clearStake;
    mapping(address => uint256) private __rewards;
    mapping(address => uint256) private __lastUpdateAt;
    
    address internal _vault;
    uint256 internal _rewardPerSecond = 1982496194824962; // ~ 62520000000000000000000 per year

    event AddStake(
        address indexed staker,
        uint256 value,
        uint256 resultClearStake,
        uint256 resultTotalClearStake,
        uint256 timestamp
    );
    event SubStake(
        address indexed staker,
        uint256 value,
        uint256 resultClearStake,
        uint256 resultTotalClearStake,
        uint256 timestamp
    );

    function stakeOf(address target) external view override returns (uint256) {
        return (_stakeOf(target));
    }

    function expectedReward(address target) external view override returns (uint256) {
        return _expectedReward(target);
    }

    function rewardsOf(address target) external view override returns (uint256) {
        return (__rewards[target]).add(_expectedReward(target));
    }

    function clearStakeOf(address target) external view override returns (uint256) {
        return __clearStake[target];
    }

    function totalClearStake() external view override returns (uint256) {
        return __totalClearStake;
    }

    function rewardPerSecond() external view override returns(uint256) {
        return _rewardPerSecond;
    }

    function lastUpdateAt(address target) external view override returns(uint256) {
        return __lastUpdateAt[target];
    }

    function vault() external view override returns(address) {
        return _vault;
    }

    function _addStake(address staker, uint256 value) internal {
        __totalClearStake = __totalClearStake.add(value);
        __clearStake[staker] = __clearStake[staker].add(value);

        emit AddStake(staker, value, __clearStake[staker], __totalClearStake, block.timestamp);
    }

    function _subStake(address staker, uint256 value) internal {
        __totalClearStake = __totalClearStake.sub(value);
        __clearStake[staker] = __clearStake[staker].sub(value);

        emit SubStake(staker, value, __clearStake[staker], __totalClearStake, block.timestamp);
    }

    function _stakeOf(address target) internal view returns (uint256) {
        return(__clearStake[target].add(_expectedReward(target)));
    }


    function _expectedReward(address target) internal view returns (uint256) {
        if (__lastUpdateAt[target] > 0 && __clearStake[target] > 0) {
            return((block.timestamp.sub(__lastUpdateAt[target])).mul(_rewardPerSecond));
        } else {
            return 0;
        }
    }

    function _clearStakeOf(address target) internal view returns (uint256) {
        return(__clearStake[target]);
    }

    function _recalculateStaker(address target) internal {
        if (__lastUpdateAt[target] > 0 && __clearStake[target] > 0) {
            uint256 expectedRwd = _expectedReward(target);
            _addStake(target, expectedRwd);
            __rewards[target] = __rewards[target].add(expectedRwd);

            IVault(_vault).vaultWithdraw(expectedRwd);
        }
        __lastUpdateAt[target] = block.timestamp;
    }
}
