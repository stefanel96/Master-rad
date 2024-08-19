// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./GoldToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract SwapEthAndGold is Ownable {
    GoldToken gldToken;
    uint256 public gldTokensPerEth = 100;

    event Swap(
        address indexed swapper,
        string swapType,
        uint256 ethAmount,
        uint256 goldAmount
    );

    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    constructor(address gldTokenAddres) {
        gldToken = GoldToken(gldTokenAddres);
    }

    function addLiquidity() public payable onlyOwner {}

    /*
     * Swapping Ethereum tokens in exchange for GOLD tokens.
     * Returns the amount of gold tokens that have been bought.
     */
    function buyGLDTokens() public payable returns (uint256 amountGLD) {
        require(
            msg.value > 0.1 ether,
            "Minimum amount should equal to 0.1 ETH."
        );

        uint256 amountOfGLDTokensToBeBought = SafeMath.mul(
            msg.value,
            gldTokensPerEth
        );

        uint256 contractBalanceOfGLDTokens = gldToken.balanceOf(address(this));
        require(
            contractBalanceOfGLDTokens >= amountOfGLDTokensToBeBought,
            "Contract hasn't got enough GOLD tokens to cover this swap."
        );

        bool isTransferred = gldToken.transfer(
            msg.sender,
            amountOfGLDTokensToBeBought
        );
        require(
            isTransferred == true,
            "Transfer of the GOLD tokens has failed."
        );

        emit Swap(msg.sender, "buy", msg.value, amountOfGLDTokensToBeBought);

        return amountOfGLDTokensToBeBought;
    }

    /*
     * Swapping GOLD tokens in exchange for Ethereum tokens.
     * Returns whether the swap has been successful.
     */
    function sellGLDTokens(uint256 amountGLD) public returns (bool success) {
        require(amountGLD > 0, "Amount must be greater than 0.");
        require(
            gldToken.balanceOf(msg.sender) >= amountGLD,
            "Not enough GOLD tokens."
        );

        uint256 amountETH = SafeMath.div(amountGLD, gldTokensPerEth);
        require(
            address(this).balance >= amountETH,
            "Contract has not enough ETH."
        );

        bool isTransferred = gldToken.transferFrom(
            msg.sender,
            address(this),
            amountGLD
        );
        require(
            isTransferred == true,
            "Transfer of the GOLD tokens has failed."
        );

        payable(msg.sender).transfer(amountETH);

        emit Swap(msg.sender, "sell", amountETH, amountGLD);

        return true;
    }
}
