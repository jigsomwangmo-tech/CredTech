import { expect } from "chai";
import { ethers } from "hardhat";

describe("MultiSigWallet", function () {
  async function deployWalletFixture() {
    const [deployer, secondOwner, thirdOwner, recipient] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("MultiSigWallet");
    const wallet = await factory.deploy();

    return { wallet, deployer, secondOwner, thirdOwner, recipient };
  }

  it("starts with the deployer as sole owner and threshold 1", async function () {
    const { wallet, deployer } = await deployWalletFixture();

    expect(await wallet.getOwners()).to.deep.equal([deployer.address]);
    expect(await wallet.threshold()).to.equal(1);
    expect(await wallet.isOwner(deployer.address)).to.equal(true);
  });

  it("adds owners and changes threshold through self-calls", async function () {
    const { wallet, deployer, secondOwner, thirdOwner } = await deployWalletFixture();

    const addSecondOwner = wallet.interface.encodeFunctionData("addOwner", [secondOwner.address]);
    await wallet.submitTransaction(await wallet.getAddress(), 0, addSecondOwner);
    await wallet.approveTransaction(0);
    await wallet.executeTransaction(0);

    const addThirdOwner = wallet.interface.encodeFunctionData("addOwner", [thirdOwner.address]);
    await wallet.submitTransaction(await wallet.getAddress(), 0, addThirdOwner);
    await wallet.approveTransaction(1);
    await wallet.executeTransaction(1);

    const changeThreshold = wallet.interface.encodeFunctionData("changeThreshold", [2]);
    await wallet.submitTransaction(await wallet.getAddress(), 0, changeThreshold);
    await wallet.approveTransaction(2);
    await wallet.connect(secondOwner).approveTransaction(2);
    await wallet.executeTransaction(2);

    expect(Array.from(await wallet.getOwners())).to.have.members([
      deployer.address,
      secondOwner.address,
      thirdOwner.address,
    ]);
    expect(await wallet.threshold()).to.equal(2);
  });

  it("requires enough approvals before execution", async function () {
    const { wallet, secondOwner, recipient } = await deployWalletFixture();

    const addSecondOwner = wallet.interface.encodeFunctionData("addOwner", [secondOwner.address]);
    await wallet.submitTransaction(await wallet.getAddress(), 0, addSecondOwner);
    await wallet.approveTransaction(0);
    await wallet.executeTransaction(0);

    const changeThreshold = wallet.interface.encodeFunctionData("changeThreshold", [2]);
    await wallet.submitTransaction(await wallet.getAddress(), 0, changeThreshold);
    await wallet.approveTransaction(1);
    await wallet.connect(secondOwner).approveTransaction(1);
    await wallet.executeTransaction(1);

    await ethers.provider.send("hardhat_setBalance", [await wallet.getAddress(), "0x2386f26fc10000"]);

    await wallet.submitTransaction(recipient.address, ethers.parseEther("0.001"), "0x");
    await wallet.approveTransaction(2);

    await expect(wallet.executeTransaction(2)).to.be.revertedWith("MultiSigWallet: insufficient approvals");

    await wallet.connect(secondOwner).approveTransaction(2);
    await expect(wallet.executeTransaction(2)).to.changeEtherBalances(
      [wallet, recipient],
      [-ethers.parseEther("0.001"), ethers.parseEther("0.001")],
    );
  });
});
