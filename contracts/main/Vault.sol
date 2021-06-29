// SPDX-License-Identifier: MIT
// solhint-disable not-rely-on-time, reason-string, no-inline-assembly]

pragma solidity 0.6.12;

import "../interfaces/IVault.sol";

/**
 * @dev Vault for staking contract
 */
contract Vault is IVault {
    event VaultReplenishment(address indexed from, uint256 amount, uint256 timestamp);
    event VaultWithdraw(address indexed from, uint256 amount, uint256 timestamp);

    address private __stakingContract = address(0);

    function register() override external returns(bool) {
        require(__stakingContract == address(0), "Vault: already registered");

        __stakingContract = msg.sender;

        return true;
    }

    receive() external payable {
        emit VaultReplenishment(msg.sender, msg.value, block.timestamp);
    }

    function vaultWithdraw(uint256 amount) external override returns(bool) {
        require(msg.sender == __stakingContract, "Vault: access error");
        require(amount <= address(this).balance, "Vault: insufficient funds in the vault");

        msg.sender.transfer(amount);

        emit VaultWithdraw(msg.sender, amount, block.timestamp);

        return true;
    }

    function stakingContract() external view override returns(address) {
        return __stakingContract;
    }
}