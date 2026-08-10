# Master's Thesis

Implementation of a decentralized non-fungible token (NFT) marketplace for the video game industry.

## Technologies

This project uses the following technologies:

* **Solidity** – language for writing smart contracts.
* **Hardhat** – development environment for compiling, testing, and deploying smart contracts on the Ethereum blockchain.
* **Chai** – testing library that makes it easier to test smart contracts.

## Environment Setup

To set up the environment, follow these steps:

1. Navigate to the project's root folder.
2. Install the required dependencies: `npm install`
3. Start a local Ethereum blockchain node: `npx hardhat node`
4. Open a new terminal instance.
5. Deploy the smart contracts to the blockchain: `npx hardhat run ./src/backend/scripts/deploy.js --network localhost`
6. Launch the Hardhat console: `npx hardhat console`

You can now interact with the smart contracts on the local blockchain using the addresses generated during deployment.
