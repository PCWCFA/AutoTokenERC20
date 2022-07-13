const { inputToConfig } = require("@ethereum-waffle/compiler");
const { assert, expect } = require("chai");
const { getNamedAccounts, network, deployments, ethers } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("AutoToken Unit Tests", function () {
      let autoToken, deployer;

      beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer;
        receiver1 = (await getNamedAccounts()).receiver1;
        receiver2 = (await getNamedAccounts()).receiver2;
        await deployments.fixture(["all"]);
        autoToken = await ethers.getContract("AutoToken", deployer);
        autoTokenReceiver1 = await ethers.getContract(
          "AutoToken",
          receiver1
        );
        autoTokenReceiver2 = await ethers.getContract(
          "AutoToken",
          receiver2
        );
      });

      describe("Constructor", function () {
        it("UT01: Initializes AutoToken correctly", async function () {
          const totalSupply = await autoToken.totalSupply();
          const startingBalance = await autoToken.balanceOf(deployer);

          assert.equal(totalSupply, 1000);
          assert.equal(startingBalance, 1000);
        });
      });

      describe("Constants", function () {
        it("UT02: Check the token name", async function () {
          const tokenName = await autoToken.name();
          assert.equal(tokenName, "AutoToken");
        });

        it("UT03: Check the symbol", async function () {
          const tokenSymbol = await autoToken.symbol();
          assert.equal(tokenSymbol, "AT");
        });

        it("UT04: Check the decimals", async function () {
          const tokenDecimals = await autoToken.decimals();
          assert.equal(tokenDecimals.toString(), "18");
        });
      });

      describe("transfer", function () {
        it("UT05: Successful transfer from deployer to receiver1", async function () {
          const deployerStartingBalance = await autoToken.balanceOf(deployer);
          await expect(autoToken.transfer(receiver1, 20)).to.emit(
            autoToken,
            "Transfer"
          );
          const receiver1Balance = await autoToken.balanceOf(receiver1);
          const deployerBalance = await autoToken.balanceOf(deployer);

          assert.equal(parseInt(receiver1Balance._hex), 20);
          assert.equal(
            parseInt(deployerBalance._hex),
            parseInt(deployerStartingBalance._hex) - 20
          );
        });

        it("UT06: Failed transfer 5000 to receiver1", async function () {
          await expect(
            autoToken.transfer(receiver1, 5000)
          ).to.be.reverted;
        });
      });

      describe("transferFrom", function () {
        beforeEach(async function () {
          //receiver1 approves receiver2 to spend 500 max on behalf of receiver1
          await expect(autoTokenReceiver1.approve(receiver2, 500)).to.emit(
            autoTokenReceiver1,
            "Approval"
          );
          //deployer transfers 200 to receiver1
          await expect(autoToken.transfer(receiver1, 200)).to.emit(
            autoToken,
            "Transfer"
          );
        });

        it("UT07: Ensure receiver1 balance == 200", async function () {
          const receiver11Balance = await autoToken.balanceOf(receiver1);
          assert.equal(parseInt(receiver11Balance._hex), 200);
        });

        it("UT08: Ensure receiver2 allowance == 500", async function () {
          const receiver2Allowance = await autoToken.allowance(
            receiver1,
            receiver2
          );

          assert.equal(parseInt(receiver2Allowance._hex), 500);
        });

        it("UT09: transferFrom receiver1 to receiver2 exceeds the approved limit", async function () {
          await expect(
            autoTokenReceiver2.transferFrom(receiver1, receiver2, 600)
          ).to.be.reverted;
        });

        it("UT10: transfeFrom receiver1 to receiver2 is greater than the amount in receiver1's account", async function () {
          await expect(
            autoTokenReceiver2.transferFrom(receiver1, receiver2, 300)
          ).to.be.reverted;
        });

        it("UT11: transfeFrom receiver1 to receiver2 successful", async function () {
          await expect(
            autoTokenReceiver2.transferFrom(receiver1, receiver2, 100)
          ).to.emit(autoToken, "Transfer");
        });
      });
    });
