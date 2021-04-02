pragma solidity ^0.6.12;

import "./Stakeholder.sol";
import "./Stakes.sol";

abstract contract Reward is Stakes, Stakeholder {
    mapping(address => uint256) internal _accumulated;

    uint256 internal _roundStartTime;

    uint256 internal _emissionSpeed; // how many mint eth every second

    function rewardOf(address stakeholder) external view returns (uint256) {
        return (_accumulated[stakeholder] + _roundRewardOf(stakeholder));
    }

    function roundRewardOf(address target) external view returns (uint256) {
        return _roundRewardOf(target);
    }

    function accumulatedRewardOf(address stakeholder)
        external
        view
        returns (uint256)
    {
        return _accumulated[stakeholder];
    }

    function _recalculateRound() internal {
        for (uint256 i = 0; i < _stakeholders.length; i++) {
            address stakeholder = _stakeholders[i];
            _accumulated[stakeholder] = _accumulated[stakeholder].add(
                _roundRewardOf(stakeholder)
            );
        }
        _roundStartTime = block.timestamp;
    }

    function _subAccumulatedReward(address target, uint256 value) internal {
        _accumulated[target] = _accumulated[target].sub(value);
    }

    function _roundRewardOf(address target) internal view returns (uint256) {
        (bool isExist, ) = _isStakeholder(target);
        if (_totalStake != 0 && isExist) {
            // (current time - last distribution time) * emission speed * user stake / total stake
            return (
                (block.timestamp.sub(_roundStartTime))
                    .mul(_emissionSpeed)
                    .mul(_stake[target])
                    .div(_totalStake)
            );
        }
        return 0;
    }
}
