pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "./IDiscountingContract.sol";

contract DiscountingContract is IDiscountingContract {

    mapping(uint256 => Supplier) public Suppliers;
    uint256 public SuppliersLength = 0;
    bool public inited = false;

    function initContract(Supplier[] memory _rule) public {
        require(inited == false);
        for (uint256 i = 0; i < _rule.length; i++) {
            Suppliers[SuppliersLength] = _rule[i];
            SuppliersLength++;
        }
        inited = true;
    }

    function getSuppliers() external view override returns(Supplier[] memory) {
        Supplier[] memory result = new Supplier[](SuppliersLength);
        for (uint256 i = 0; i < result.length; i++) {
            result[i] = Suppliers[i];
        }
        return result;
    }

}

