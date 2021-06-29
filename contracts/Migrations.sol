// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

contract Migrations {
    address public owner;
    uint256 public lasCompletedMigration;

    constructor() public {
        owner = msg.sender;
    }

    modifier restricted() {
        if (msg.sender == owner) _;
    }

    function setCompleted(uint256 completed) public restricted {
        lasCompletedMigration = completed;
    }

    function upgrade(address newAddress) public restricted {
        Migrations upgraded = Migrations(newAddress);
        upgraded.setCompleted(lasCompletedMigration);
    }
}
