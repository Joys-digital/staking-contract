pragma solidity ^0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";

abstract contract Stakes {
    using SafeMath for uint256;

    uint256 internal _totalStake;
    mapping(address => uint256) internal _stake;

    event AddStake(
        address staker,
        uint256 value,
        uint256 resultStakeOf,
        uint256 timestamp
    );
    event SubStake(
        address staker,
        uint256 value,
        uint256 resultStakeOf,
        uint256 timestamp
    );

    function totalStake() external view returns (uint256) {
        return _totalStake;
    }

    function stakeOf(address target) external view returns (uint256) {
        return _stake[target];
    }

    function addStake(address staker, uint256 value) internal {
        _totalStake = _totalStake.add(value);
        _stake[staker] = _stake[staker].add(value);

        emit AddStake(staker, value, _stake[staker], block.timestamp);
    }

    function subStake(address staker, uint256 value) internal {
        _totalStake = _totalStake.sub(value);
        _stake[staker] = _stake[staker].sub(value);

        emit SubStake(staker, value, _stake[staker], block.timestamp);
    }
}
