// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract NFT is ERC721URIStorage {
    uint public tokenCount;

    constructor() ERC721("NFT", "NFT") {}

    /*
     * Function for minting of the NFT and setting of his metadata
     * @param _tokenURI The URI to the metadata - link to the IPFS of the NFT
     * Returns the ID of the newest NFT that has been minted
     */
    function mint(string memory _tokenURI) external returns (uint) {
        tokenCount++;
        _safeMint(msg.sender, tokenCount);
        _setTokenURI(tokenCount, _tokenURI);
        return (tokenCount);
    }
}
