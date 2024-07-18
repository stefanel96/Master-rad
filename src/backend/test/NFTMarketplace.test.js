const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTMarketplace", async function () {
  let deployer, addr1, addr2, nft, marketplace, goldToken, swapEthAndGold;
  const uri = "https://ipfs.io/ipfs/Qm...";

  beforeEach(async function () {
    const NFT = await ethers.getContractFactory("NFT");
    const Marketplace = await ethers.getContractFactory("Marketplace");
    const GoldToken = await ethers.getContractFactory("GoldToken");
    const SwapContract = await ethers.getContractFactory("SwapEthAndGold");

    [deployer, addr1, addr2] = await ethers.getSigners();

    nft = await NFT.deploy();
    goldToken = await GoldToken.deploy(100000);
    marketplace = await Marketplace.deploy(5, goldToken.address);
    swapEthAndGold = await SwapContract.deploy(goldToken.address);

    await swapEthAndGold.addLiquidity({
      value: ethers.utils.parseEther("10"),
    });
  });

  describe("Deployment", function () {
    it("Should set the right deployer of the NFT marketplace", async function () {
      expect(await marketplace.feeAccount()).to.equal(deployer.address);
    });

    it("Should mint the correct amount of the gold tokens to the right deployer", async function () {
      const balance = await goldToken.balanceOf(deployer.address);
      expect(balance).to.equal(ethers.utils.parseUnits("100000", 18));
    });
  });

  describe("Marketplace functionality", function () {
    beforeEach(async function () {
      await nft.connect(addr1).mint(uri);
    });

    it("Should allow to list an item", async function () {
      await nft.connect(addr1).approve(marketplace.address, 1);
      await marketplace
        .connect(addr1)
        .makeItem(nft.address, 1, ethers.utils.parseEther("200"));

      const item = await marketplace.Items(1);
      expect(item).to.exist;
      expect(item.seller).to.equal(addr1.address);
      expect(ethers.utils.parseEther("200")).to.be.equal(item.price);
    });

    it("Should allow to purchase an item", async function () {
      await nft.connect(addr1).mint(uri);
      await nft.connect(addr1).approve(marketplace.address, 2);
      await marketplace
        .connect(addr1)
        .makeItem(nft.address, 2, ethers.utils.parseEther("200"));

      await goldToken
        .connect(deployer)
        .approve(marketplace.address, ethers.utils.parseEther("500"));
      await marketplace.connect(deployer).purchaseItem(1);

      const item = await marketplace.Items(1);
      expect(item.sold).to.equal(true);
    });

    it("Should fail to list an item with zero price", async function () {
      await expect(
        marketplace.connect(addr1).makeItem(nft.address, 1, 0)
      ).to.be.revertedWith("Price must be greater than zero");
    });

    it("Should fail with an invalid NFT address", async function () {
      const invalidNFTAddress = "0x0000000000000000000000000000000000000000";
      await expect(
        marketplace
          .connect(addr1)
          .makeItem(invalidNFTAddress, 1, ethers.utils.parseEther("1"))
      ).to.be.revertedWith("function call to a non-contract account");
    });

    it("Should fail to purchase an already sold item", async function () {
      await nft.connect(addr1).mint(uri);
      await nft.connect(addr1).approve(marketplace.address, 1);
      await marketplace
        .connect(addr1)
        .makeItem(nft.address, 1, ethers.utils.parseEther("100"));

      await goldToken
        .connect(deployer)
        .transfer(addr1.address, ethers.utils.parseEther("200"));
      await goldToken
        .connect(addr1)
        .approve(marketplace.address, ethers.utils.parseEther("100"));
      await marketplace.connect(addr1).purchaseItem(1);

      await goldToken
        .connect(deployer)
        .transfer(addr2.address, ethers.utils.parseEther("500"));
      await goldToken
        .connect(addr2)
        .approve(marketplace.address, ethers.utils.parseEther("500"));

      await expect(
        marketplace.connect(addr2).purchaseItem(1)
      ).to.be.revertedWith("Item is already sold.");
    });

    it("Should fail to purchase multiple items without sufficient funds", async function () {
      await nft.connect(addr1).mint(uri);
      await nft.connect(addr1).approve(marketplace.address, 1);
      await marketplace
        .connect(addr1)
        .makeItem(nft.address, 1, ethers.utils.parseEther("200"));

      await goldToken
        .connect(addr1)
        .approve(marketplace.address, ethers.utils.parseEther("100"));
      await expect(
        marketplace.connect(addr1).purchaseItem(1)
      ).to.be.revertedWith("Not enough GOLD tokens to cover the item price.");
    });
  });

  describe("Swap functionality", function () {
    beforeEach(async function () {
      await goldToken.transfer(
        addr1.address,
        ethers.utils.parseUnits("1000", 18)
      );
      await swapEthAndGold.addLiquidity({
        value: ethers.utils.parseUnits("1000", 18),
      });
      await swapEthAndGold.addLiquidity({
        value: ethers.utils.parseEther("1000"),
      });
      await goldToken.transfer(
        swapEthAndGold.address,
        ethers.utils.parseUnits("1000", 18)
      );
    });

    it("Should allow to BUY Gold tokens for ETH", async function () {
      const amountEthToSend = ethers.utils.parseEther("0.2");
      const initialBalanceEth = await ethers.provider.getBalance(addr1.address);

      const tx = await swapEthAndGold
        .connect(addr1)
        .buyGLDTokens({ value: amountEthToSend });
      const receipt = await tx.wait();

      const finalBalanceEth = await ethers.provider.getBalance(addr1.address);
      const gasUsed = receipt.gasUsed.mul(tx.gasPrice);
      const expectedFinalBalanceEth = initialBalanceEth
        .sub(amountEthToSend)
        .sub(gasUsed);
      expect(finalBalanceEth).to.equal(expectedFinalBalanceEth);
    });

    it("Should allow to SELL Gold tokens for ETH", async function () {
      const initialBalanceEth = await ethers.provider.getBalance(addr1.address);
      const initialBalanceGLD = await goldToken.balanceOf(addr1.address);

      await goldToken
        .connect(addr1)
        .approve(swapEthAndGold.address, ethers.utils.parseEther("100"));
      const tx = await swapEthAndGold
        .connect(addr1)
        .sellGLDTokens(ethers.utils.parseEther("100"));

      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.mul(tx.gasPrice);

      const finalBalanceEth = await ethers.provider.getBalance(addr1.address);
      const finalBalanceGLD = await goldToken.balanceOf(addr1.address);

      // 100 GLD per 1 ETH
      const expectedFinalBalanceEth = initialBalanceEth.add(
        ethers.utils.parseEther("1")
      );

      const expectedFinalBalanceGLD = initialBalanceGLD.sub(
        ethers.utils.parseEther("100")
      );
      expect(finalBalanceGLD).to.equal(expectedFinalBalanceGLD);
    });
  });

  describe("Integration Tests", function () {
    it("Should handle a full transaction buying an NFT with GOLD tokens", async function () {
      await nft.connect(addr1).mint(uri);
      await nft.connect(addr1).approve(marketplace.address, 1);
      await marketplace
        .connect(addr1)
        .makeItem(nft.address, 1, ethers.utils.parseEther("200"));

      await goldToken
        .connect(deployer)
        .transfer(addr2.address, ethers.utils.parseEther("500"));

      await goldToken
        .connect(addr2)
        .approve(marketplace.address, ethers.utils.parseEther("200"));
      await marketplace.connect(addr2).purchaseItem(1);

      const item = await marketplace.Items(1);
      expect(item.sold).to.equal(true);
      expect(await nft.ownerOf(1)).to.equal(addr2.address);
    });

    it("Should refund on a failed purchase", async function () {
      await nft.connect(addr1).mint(uri);
      await nft.connect(addr1).approve(marketplace.address, 1);
      await marketplace
        .connect(addr1)
        .makeItem(nft.address, 1, ethers.utils.parseEther("100"));

      const initialBalance = await goldToken.balanceOf(addr2.address);
      await expect(marketplace.connect(addr2).purchaseItem(1)).to.be.reverted;
      const finalBalance = await goldToken.balanceOf(addr2.address);
      expect(finalBalance).to.equal(initialBalance);
    });

    it("Should automatically distribute transaction fees", async function () {
      await goldToken
        .connect(deployer)
        .transfer(addr2.address, ethers.utils.parseEther("10"));

      const initialBalance = await goldToken.balanceOf(deployer.address);

      const salePrice = ethers.utils.parseEther("5");
      await nft.connect(addr1).mint(uri);
      await nft.connect(addr1).approve(marketplace.address, 1);
      await marketplace.connect(addr1).makeItem(nft.address, 1, salePrice);

      await goldToken.connect(addr2).approve(marketplace.address, salePrice);
      await marketplace.connect(addr2).purchaseItem(1);

      const fee = salePrice.mul(await marketplace.feePercent()).div(100);

      const expectedFinalBalance = initialBalance.add(fee);
      const feeAccountFinalBalance = await goldToken.balanceOf(
        deployer.address
      );

      expect(feeAccountFinalBalance).to.equal(expectedFinalBalance);
    });
  });
});
