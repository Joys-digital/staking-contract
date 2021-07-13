// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

interface IJoysStaking {

    function deposit() external payable returns(bool success);

    function withdraw(uint256 amount) external returns(bool success);

    function emergencyClosePosition(address payable target) external returns(bool success);

    function minimalStake() external view returns(uint256);

}
