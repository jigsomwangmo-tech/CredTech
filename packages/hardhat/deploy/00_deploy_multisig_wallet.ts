import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployMultiSigWallet: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("MultiSigWallet", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  const multiSigWallet = await hre.ethers.getContract("MultiSigWallet", deployer);
  console.log("MultiSigWallet deployed at:", await multiSigWallet.getAddress());
  console.log("Initial threshold:", (await multiSigWallet.threshold()).toString());
};

export default deployMultiSigWallet;

deployMultiSigWallet.tags = ["MultiSigWallet"];
