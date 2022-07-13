const { getNamedAccounts, network } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  // set up the args to the constructor
  const totalSupply = 1000;
  const args = [totalSupply];

  const autoToken = await deploy("AutoToken", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    log("Verifying...");

    await verify(autoToken.address, totalSupply);
  }
  log("Deployment completed");
  log("--------------------");
};

module.exports.tags = ["all", "manualtoken"];
