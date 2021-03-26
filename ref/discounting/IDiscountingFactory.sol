pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "./DiscountingTypes.sol";

interface IDiscountingFactory is DiscountingTypes {

    function createAuction(uint256 _hasAmount, uint256 _minPercent) external returns(uint256);

    function respondAuction(uint256 _id, uint256 _needAmount, uint256 _discountPercent) external returns(bool);

    function executeAuction(uint256 _id) external returns(address);

    function getAuctionDetails(uint256 _id) external view returns(Auction memory);

    function getContractDetails(address _contractAddress) external view returns(Supplier[] memory);

    //
    // no gas control methods
    //

    function getAuctionSuppliers(uint256 _id) external view returns(Supplier[] memory);

    function getOtherOpenAuctions() external view returns(uint256[] memory);

    function getMyOpenAuctions() external view returns(uint256[] memory);

    function getClosedAuctions() external view returns(uint256[] memory);

}
