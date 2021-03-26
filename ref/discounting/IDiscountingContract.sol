pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "./DiscountingTypes.sol";

interface IDiscountingContract is DiscountingTypes {

    function getSuppliers() external view returns(Supplier[] memory);

}

