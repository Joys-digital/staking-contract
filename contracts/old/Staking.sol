pragma solidity ^0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/math/SignedSafeMath.sol";

contract Staking {
    using SafeMath for uint256;
    using SignedSafeMath for int256;

    uint256 internal _emissionSpeed; // how many mint eth every second

    uint256 internal _totalStake;

    uint256 internal _lastDistributionTime; // unix timestamp

    mapping(address => uint256) internal _stake;
    mapping(address => int256) internal _moneybox;

    constructor(uint256 emissionSpeed) public payable {
        require(emissionSpeed > 0);
        _emissionSpeed = emissionSpeed;
        _lastDistributionTime = block.timestamp;
    }

    function deposit() external payable {
        _stake[msg.sender] = _stake[msg.sender].add(msg.value);
        _totalStake = _totalStake.add(msg.value);

        // todo add recalculate
        _lastDistributionTime = block.timestamp;
    }

    function withdraw(uint256 amount) external {
        uint256 maxWithdrawalAmount = _withdrawalAmountOf(msg.sender);

        require(amount <= maxWithdrawalAmount, "Big amount");

        // TODO check reentrancy attack
        _stake[msg.sender] = _stake[msg.sender].sub(amount);
        _moneybox[msg.sender] = _moneybox[msg.sender].sub(int128(amount));
        _totalStake = _totalStake.sub(amount);
        msg.sender.transfer(amount);
    }

    function totalStake() external view returns (uint256) {
        return _totalStake;
    }

    function stakeOf(address target) external view returns (uint256) {
        return _stake[target];
    }

    function withdrawalAmountOf(address target)
        external
        view
        returns (uint256)
    {
        return _withdrawalAmountOf(target);
    }

    function _calculateRewardFor(address target)
        internal
        view
        returns (uint256)
    {
        // (current time - last distribution time) * emission speed * user stake / total stake
        return (
            (block.timestamp.sub(_lastDistributionTime))
                .mul(_emissionSpeed)
                .mul(_stake[target])
                .div(_totalStake)
        );
    }

    function _withdrawalAmountOf(address target)
        internal
        view
        returns (uint256)
    {
        // TODO make safemath
        return uint256(int256(_calculateRewardFor(target)) + _moneybox[target]);
    }
}
