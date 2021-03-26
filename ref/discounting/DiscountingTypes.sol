pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

interface DiscountingTypes {

    struct Supplier {
        address supplierAddress;
        uint256 needAmount;
        uint256 discountPercent;
    }

    struct Auction {
        uint256 id;
        address buyer;
        uint256 minPercent;
        uint256 hasAmount;
        address signedContract;
    }

}

