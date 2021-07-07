// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

interface IVault {
    function vaultWithdraw(uint256 amount) external returns(bool);
    function stakingContract() external view returns(address);
    function register() external returns(bool);
}