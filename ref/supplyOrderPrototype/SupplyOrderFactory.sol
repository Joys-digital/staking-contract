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

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./SupplyOrderTypes.sol";
import "./SupplyOrderContract.sol";


contract SupplyOrderFactory is SupplyOrderTypes, Ownable {

    using SafeMath for uint256;

    enum Side {BUY, SELL}

    struct P2POrder {
        uint256 id;
        address initiator;
        Side ordeSide;
        address target;
        string description;
        ContractRule rule;
        SupplyOrderContract signedContract;
    }


    //
    // Storage
    //

    SupplyOrderContract[] public contracts;
    P2POrder[] public p2pOrders;

    //
    // Events
    //

    event CreatedP2POrder(uint256 _id, address indexed _from, Side indexed _side, address indexed _to, uint256 _timestamp);
    event AcceptedP2POrder(uint256 _id, address indexed _from, Side indexed _side, address indexed _to, uint256 _timestamp);

    //
    // External methods
    //

    function createP2POrder(
        Side _side,
        address _to,
        string memory _description,
        ContractRule memory _rule
    ) external returns(uint256) {
        require(_to != msg.sender, "DiscountingFactory: wrong _to parameter");
        // <-- TODO check _rule

        P2POrder memory newOrder = P2POrder({
            id: p2pOrders.length,
            initiator: msg.sender,
            ordeSide: _side,
            target: _to,
            description: _description,
            rule: _rule,
            signedContract: SupplyOrderContract(address(0))
        });

        p2pOrders.push(newOrder);
        uint newOrderId = p2pOrders.length.sub(1);

        emit CreatedP2POrder(newOrderId, msg.sender, _side, _to, block.timestamp);

        return newOrderId;
    }

    function acceptP2POrder(uint256 _orderId) external returns(address) {
        require(p2pOrders[_orderId].target == msg.sender, "DiscountingFactory: wrong target");
        require(address(p2pOrders[_orderId].signedContract) == address(0), "DiscountingFactory: p2p-order already accepted");
        
        address payable buyer;
        address payable supplier;
        if (p2pOrders[_orderId].ordeSide == Side.BUY) {
            buyer = payable(p2pOrders[_orderId].initiator);
            supplier = payable(p2pOrders[_orderId].target);
        } else {
            buyer = payable(p2pOrders[_orderId].target);
            supplier = payable(p2pOrders[_orderId].initiator);
        }
        SupplyOrderContract newContract = new SupplyOrderContract(
            buyer,
            supplier,
            p2pOrders[_orderId].description,
            p2pOrders[_orderId].rule
        );

        contracts.push(newContract);
        p2pOrders[_orderId].signedContract = newContract;

        emit AcceptedP2POrder(_orderId, msg.sender, p2pOrders[_orderId].ordeSide, p2pOrders[_orderId].target, block.timestamp);

        return address(newContract);
    }

    function getOrderDetails(uint256 _orderId) external view returns(P2POrder memory) {
        return(p2pOrders[_orderId]);
    }

    function getOrderDetailsList(uint256[] memory _orderIds) external view returns(P2POrder[] memory) {
        P2POrder[] memory result = new P2POrder[](_orderIds.length);
        for (uint256 i = 0; i < _orderIds.length; i++) {
            result[i] = p2pOrders[_orderIds[i]];
        }
        return result;
    }

}
