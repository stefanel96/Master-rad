async function main() {
  const [deployer] = await ethers.getSigners();

  const goldInitialSupply = "100000";

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Get the ContractFactories and signers here
  const NFT = await ethers.getContractFactory("NFT");
  const Marketplace = await ethers.getContractFactory("Marketplace");
  const GoldToken = await ethers.getContractFactory("GoldToken");
  const SwapContract = await ethers.getContractFactory("SwapEthAndGold");

  // Deploy contracts
  const nft = await NFT.deploy();
  const goldToken = await GoldToken.deploy(goldInitialSupply);
  const marketplace = await Marketplace.deploy(1, goldToken.address);
  const swapEthAndGold = await SwapContract.deploy(goldToken.address);

  console.log("GoldToken contract address:", goldToken.address);
  console.log("NFT contract address:", nft.address);
  console.log("Marketplace contract address:", marketplace.address);
  console.log("SwapEthAndGold contract address:", swapEthAndGold.address);

  // Save copies of each contracts abi and address
  saveContractsData(marketplace, "Marketplace");
  saveContractsData(nft, "NFT");
  saveContractsData(goldToken, "GoldToken");
  saveContractsData(swapEthAndGold, "SwapEthAndGold");
}

function saveContractsData(contract, name) {
  const fs = require("fs");
  const contractsDir = __dirname + "/../../contractsData";

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    contractsDir + `/${name}-address.json`,
    JSON.stringify({ address: contract.address }, undefined, 2)
  );

  const contractArtifact = artifacts.readArtifactSync(name);

  fs.writeFileSync(
    contractsDir + `/${name}.json`,
    JSON.stringify(contractArtifact, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
