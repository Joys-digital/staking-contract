pragma solidity ^0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Stakeholder {
    address[] internal _stakeholders;
    uint256 internal _stakeholdersLimit;

    event AddStakeholder(address target, uint256 timestamp);
    event RemoveStakeholder(address target, uint256 timestamp);
    event ChangeStakeholdersLimit(
        uint256 oldLimit,
        uint256 newLimit,
        uint256 timestamp
    );

    function isStakeholder(address target)
        external
        view
        returns (bool result, uint256 position)
    {
        return _isStakeholder(target);
    }

    function getStakeholders() external view returns (address[] memory) {
        return _stakeholders;
    }

    function totalStakeholders() external view returns (uint256) {
        return _stakeholders.length;
    }

    function _addStakeholder(address target) internal {
        (bool isExist, ) = _isStakeholder(target);
        require(!isExist, "Stakeholder: target already exists");
        _stakeholders.push(target);

        emit AddStakeholder(target, block.timestamp);
    }

    function _removeStakeholder(address target) public {
        (bool isExist, uint256 pos) = _isStakeholder(target);
        if (isExist) {
            _stakeholders[pos] = _stakeholders[_stakeholders.length - 1];
            _stakeholders.pop();
        }

        emit RemoveStakeholder(target, block.timestamp);
    }

    function _changeStakeholdersLimit(uint256 newLimit) internal {
        uint256 oldLimit = _stakeholdersLimit;
        _stakeholdersLimit = newLimit;

        emit ChangeStakeholdersLimit(oldLimit, newLimit, block.timestamp);
    }

    function _isStakeholder(address target)
        internal
        view
        returns (bool result, uint256 position)
    {
        for (uint256 i = 0; i < _stakeholders.length; i += 1) {
            if (target == _stakeholders[i]) return (true, i);
        }
        return (false, 0);
    }
}
