// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/*
 * A Marketplace smart contract.
 * feeAccount is address that receives fees from marketplace sales.
 * feePercent is a percent from each sale that feeAccount is going to receive.
 * itemCount is the total number of items listed in the marketplace.
 * goldToken represents the goldToken smart contract and must be intialized in order to be used as a asset for paying.
 */
contract Marketplace {
    address public immutable feeAccount;
    uint public immutable feePercent;
    uint public itemCount;
    IERC20 public goldToken;

    event ItemListed(
        uint itemId,
        address nft,
        uint tokenId,
        uint256 price,
        address seller
    );

    event ItemPurchased(
        uint itemId,
        address nft,
        uint tokenId,
        uint256 price,
        address seller,
        address buyer
    );

    constructor(uint _feePercent, address _goldTokenAddress) {
        feeAccount = msg.sender;
        feePercent = _feePercent;
        goldToken = IERC20(_goldTokenAddress);
    }

    /*
     * A structure that describes each item in the Marketplace.
     * ItemId is the ID of an item in the marketplace.
     * nft is a address of a NFT smart contract that is being listed/bought.
     * tokenId is a ID of exact the NFT inside of the collection implemented by "nft" smart contract.
     * price is a value of the NFT that is going to be listed.
     * seller is the address of the wallet that has listed the NFT.
     * sold is a flag that indicates whether the NFT has been sold.
     */
    struct Item {
        uint itemId;
        IERC721 nft;
        uint tokenId;
        uint256 price;
        address payable seller;
        bool sold;
    }

    mapping(uint => Item) public Items;

    /*
     * Lists an NFT for sale on the marketplace and adds caller of the function as a seller
     * @param _nft The contract address of the NFT
     * @param _tokenId The exact tokenID of the NFT
     * @param _price The price that should be set for the NFT
     */
    function makeItem(IERC721 _nft, uint _tokenId, uint _price) external {
        require(_price > 0, "Price must be greater than zero");
        itemCount++;
        _nft.transferFrom(msg.sender, address(this), _tokenId);

        Items[itemCount] = Item(
            itemCount,
            _nft,
            _tokenId,
            _price,
            payable(msg.sender),
            false
        );

        emit ItemListed(itemCount, address(_nft), _tokenId, _price, msg.sender);
    }

    /*
     * Sells the NFT to the buyer, by transferring gold tokens to the seller and NFT to the buyer
     * @param _itemId The ID of the marketplace item
     */
    function purchaseItem(uint _itemId) external {
        Item storage item = Items[_itemId];
        uint256 totalPrice = getTotalPrice(_itemId);

        require(!item.sold, "Item is already sold.");
        require(
            goldToken.balanceOf(msg.sender) >= totalPrice,
            "Not enough GOLD tokens to cover the item price."
        );

        uint256 fullFeeAmount = SafeMath.mul(item.price, feePercent);
        uint256 percentFeeAmount = SafeMath.div(fullFeeAmount, 100);
        uint256 sellerAmount = item.price - percentFeeAmount;

        goldToken.transferFrom(msg.sender, item.seller, sellerAmount);
        goldToken.transferFrom(msg.sender, feeAccount, percentFeeAmount);

        item.sold = true;
        item.nft.transferFrom(address(this), msg.sender, item.tokenId);
        emit ItemPurchased(
            item.itemId,
            address(item.nft),
            item.tokenId,
            item.price,
            item.seller,
            msg.sender
        );
    }

    /*
     * Calculates the total price for the NFT, including the marketplace fee
     * @param _itemId The ID of the marketplace item
     */
    function getTotalPrice(uint _itemId) internal view returns (uint) {
        (bool addSuccess, uint256 addResult) = SafeMath.tryAdd(100, feePercent);
        require(addSuccess, "Adding feePercent failed");

        (bool divSuccess, uint256 divResult) = SafeMath.tryDiv(addResult, 100);
        require(divSuccess, "Dividing by 100 failed");

        (bool mulSuccess, uint256 mulResult) = SafeMath.tryMul(
            Items[_itemId].price,
            divResult
        );
        require(mulSuccess, "Multiplying price and feePercent failed");

        return mulResult;
    }
}
