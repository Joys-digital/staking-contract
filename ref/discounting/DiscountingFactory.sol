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
import "./DiscountingContract.sol";
import "./IDiscountingFactory.sol";


contract DiscountingFactory is IDiscountingFactory, Ownable {

    using SafeMath for uint256;

    //
    // Storage
    //

    DiscountingContract[] private contracts;
    Auction[] private auctions;
    mapping(uint256 => Supplier[]) private auctionsSuppliers;

    //
    // Events
    //

    event CreatedAuction(uint256 indexed _id, address indexed _buyer, uint256 _hasAmount, uint256 _minPercent, uint256 _timestamp);
    event RespondAuction(uint256 indexed _id, address indexed _responder, uint256 _discountPercent , uint256 _needAmount, uint256 _timestamp);
    event ExecutedAuction(uint256 indexed _id, address indexed _buyer, address indexed _newContractAddress);

    //
    // External methods
    //

    function createAuction(uint256 _hasAmount, uint256 _minPercent) external override returns(uint256) {
        require(_hasAmount != 0, "DiscountingFactory: wrong _hasAmount parameter");

        uint256 newId = auctions.length;
        Auction memory newAuction = Auction({
            id: newId,
            buyer: msg.sender,
            minPercent: _minPercent,
            hasAmount: _hasAmount,
            signedContract: address(0)
        });

        auctions.push(newAuction);

        emit CreatedAuction(newId, msg.sender, _hasAmount, _minPercent, block.timestamp);

        return newId;
    }

    function respondAuction(uint256 _id, uint256 _needAmount, uint256 _discountPercent) external override returns(bool) {
        require(auctions.length > _id, "DiscounstructuretingFactory: wrong _id parameter");
        require(auctions[_id].buyer != msg.sender, "DiscountingFactory: wrong msg.sender");
        require(auctions[_id].minPercent <= _discountPercent, "DiscountingFactory: wrong _discountPercent parameter");
        require(auctions[_id].hasAmount >= _needAmount, "DiscountingFactory: wrong _needAmount parameter");
        require(auctions[_id].signedContract == address(0), "DiscountingFactory: auction is closed");

        auctionsSuppliers[_id].push(Supplier({
            supplierAddress: msg.sender,
            discountPercent: _discountPercent,
            needAmount: _needAmount
        }));

        emit RespondAuction(_id, msg.sender, _discountPercent, _needAmount, block.timestamp);

        return true;
    }

    function executeAuction(uint256 _id) external override returns(address) {
        require(auctions.length > _id, "DiscountingFactory: wrong _id parameter");
        require(auctions[_id].buyer == msg.sender, "DiscountingFactory: wrong msg.sender");

        // load suppliers from storage
        Supplier[] memory newSuppliers = new Supplier[](auctionsSuppliers[_id].length);
        for (uint256 i = 0; i < newSuppliers.length; i++) {
            newSuppliers[i] = auctionsSuppliers[_id][i];
        }

        // sort
        newSuppliers = sort(newSuppliers);

        // filling
        uint256 counter = 0;
        uint256 filled = 0;
        for (uint256 i = 0; i < newSuppliers.length; i++) {
            filled = filled + newSuppliers[i].needAmount;
            if (filled > auctions[_id].hasAmount) {
                break;
            }
            counter++;
        }
        Supplier[] memory resultSuppliers = new Supplier[](counter);
        for (uint256 i = 0; i < counter; i++) {
            resultSuppliers[i] = newSuppliers[i];
        }

        DiscountingContract resultContract = new DiscountingContract();
        resultContract.initContract(resultSuppliers);
        contracts.push(resultContract);

        auctions[_id].signedContract =  address(resultContract);

        emit ExecutedAuction(_id, msg.sender, address(resultContract));

        return address(resultContract);
    }

    function getAuctionDetails(uint256 _id) external view override returns(Auction memory) {
        return auctions[_id];
    }

    function getContractDetails(address _contractAddress) external view override returns(Supplier[] memory) {
        return DiscountingContract(_contractAddress).getSuppliers();
    }

    function getAuctionsCount() external view returns(uint) {
        return auctions.length;
    }


    //
    // no gas control methods
    //

    function getAuctionSuppliers(uint256 _id) external view override returns(Supplier[] memory) {
        Supplier[] memory result = new Supplier[](auctionsSuppliers[_id].length);
        for (uint256 i = 0; i < result.length; i++) {
            result[i] = auctionsSuppliers[_id][i];
        }
        return result;
    }

    function getOtherOpenAuctions() external view override returns(uint256[] memory) {
        uint256 counter = 0;
        for (uint256 i = 0; i < auctions.length; i++) {
            if (auctions[i].buyer != msg.sender && auctions[i].signedContract == address(0)) {
                counter++;
            }
        }
        
        uint256[] memory result = new uint256[](counter);
        counter = 0;
        for (uint256 i = 0; i < auctions.length; i++) {
            if (auctions[i].buyer != msg.sender && auctions[i].signedContract == address(0)) {
                result[counter] = auctions[i].id;
                counter++;
            }
        }
        return result;
    }

    function getMyOpenAuctions() external view override returns(uint256[] memory) {
        uint256 counter = 0;
        for (uint256 i = 0; i < auctions.length; i++) {
            if (auctions[i].buyer == msg.sender && auctions[i].signedContract == address(0)) {
                counter++;
            }
        }
        
        uint256[] memory result = new uint256[](counter);
        counter = 0;
        for (uint256 i = 0; i < auctions.length; i++) {
            if (auctions[i].buyer == msg.sender && auctions[i].signedContract == address(0)) {
                result[counter] = auctions[i].id;
                counter++;
            }
        }
        return result;
    }

    function getClosedAuctions() external view override returns(uint256[] memory) {
        uint256 counter = 0;
        for (uint256 i = 0; i < auctions.length; i++) {
            if (auctions[i].signedContract != address(0)) {
                counter++;
            }
        }
        
        uint256[] memory result = new uint256[](counter);
        counter = 0;
        for (uint256 i = 0; i < auctions.length; i++) {
            if (auctions[i].signedContract != address(0)) {
                result[counter] = auctions[i].id;
                counter++;
            }
        }
        return result;
    }

    function sort(Supplier[] memory data) public view returns(Supplier[] memory) {
       quickSort(data, int(0), int(data.length - 1));
       return data;
    }

    function quickSort(Supplier[] memory arr, int left, int right) internal view {
        int i = left;
        int j = right;
        if(i==j) return;
        uint pivot = arr[uint(left + (right - left) / 2)].discountPercent;
        while (i <= j) {
            while (arr[uint(i)].discountPercent > pivot) i++;
            while (pivot > arr[uint(j)].discountPercent) j--;
            if (i <= j) {
                (arr[uint(i)], arr[uint(j)]) = (arr[uint(j)], arr[uint(i)]);
                i++;
                j--;
            }
        }
        if (left < j)
            quickSort(arr, left, j);
        if (i < right)
            quickSort(arr, i, right);
    }

    

}
