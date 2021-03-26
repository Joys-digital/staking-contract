// SPDX-License-Identifier: MIT

/**
 *                        oooo                             oooo                            oooo        
 *                        `888                             `888                            `888        
 *   .ooooo.  oooo  oooo   888   .ooooo.  oooo d8b          888 .oo.    .oooo.    .ooooo.   888  oooo  
 *  d88' `88b `888  `888   888  d88' `88b `888""8P          888P"Y88b  `P  )88b  d88' `"Y8  888 .8P'   
 *  888ooo888  888   888   888  888ooo888  888     8888888  888   888   .oP"888  888        888888.    
 *  888        888   888   888  888        888              888   888  d8(  888  888   .o8  888 `88b.  
 *  `Y8bod8P'  `V88V"V8P' o888o `Y8bod8P' d888b            o888o o888o `Y888""8o `Y8bod8P' o888o o888o                                                                                                
 *
 **/

pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "./SupplyOrderTypes.sol";


contract SupplyOrderContract is SupplyOrderTypes {

    using SafeMath for uint256;

    enum Stage {
        Initialization,
        AwaitingSupply,
        AwaitingPayment,
        Closed
    }

    //
    // Storage
    //

    address public immutable deployedBy;
    address payable public immutable buyer;
    address payable public immutable supplier;
    string public description;
    ContractRule public rule;

    Stage public stage;

    //
    // Events
    //

    event ConfirmedSupply(address _by, uint256 _timestamp);
    event ClosedContract(address _by, uint256 _timestamp);


    //
    // Modifiers
    //

    modifier atStage(Stage _stage) {
        require(
            stage == _stage,
            "DiscountingContract: Function cannot be called at this time."
        );
        _;
    }

    //
    // External methods
    //


    constructor(address payable _buyer, address payable _supplier, string memory _description, ContractRule memory _rule) public {
        deployedBy = msg.sender;
        buyer = _buyer;
        supplier = _supplier;
        description = _description;
        rule = _rule;

        stage = Stage.AwaitingSupply;
    }

    function confirmSupply() external atStage(Stage.AwaitingSupply) returns(bool) {
        require(msg.sender == buyer);
        stage = Stage.AwaitingPayment;

        emit ConfirmedSupply(msg.sender, block.timestamp);

        _closeContract();

        return true;
    }

    function closeContract() external atStage(Stage.AwaitingPayment) returns(bool) {
        require(address(this).balance >= rule.amount, "DiscountingContract: Contract balance error");
        return _closeContract();
    }

    //
    // Internal methods
    //

    function _closeContract() private returns(bool) {
        if (address(this).balance < rule.amount) {
            return false;
        }

        uint256 supplierFunds = rule.amount;
        supplier.transfer(supplierFunds);

        uint256 buyerResidual = address(this).balance.sub(rule.amount);
        if (buyerResidual > 0) {
            buyer.transfer(buyerResidual);
        }

        emit ClosedContract(msg.sender, block.timestamp);

        return true;
    }
}

