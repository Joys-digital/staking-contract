const { constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { BN } = require('@openzeppelin/test-helpers/src/setup');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

const Vault = artifacts.require("Vault");
const JoysStaking = artifacts.require("JoysStaking");


contract('Vault', function (accounts) {
  const [ owner, other ] = accounts;

  const minimalStake = web3.utils.toWei("1",'ether');;
  const stakeholdersLimit = "4";
  const nextStakeholdersLimit = "5";

  beforeEach(async function () {
    this.vaultInst = await Vault.new();
    this.joysStakingInst = await JoysStaking.new(minimalStake, stakeholdersLimit, nextStakeholdersLimit, this.vaultInst.address);
    await this.vaultInst.transferOwnership(this.joysStakingInst.address);
  });


  describe('positive', function () {
    it('correct staking contract', async function () {
      await assert.equal(
        await this.vaultInst.owner(),
        this.joysStakingInst.address
      );
    });
  });

  describe('negative', function () {
    it('already registered', async function () {
      await expectRevert(
        this.vaultInst.transferOwnership(other, {from: owner}),
        'StakingOwnable: caller is not the owner'
      );
      await expectRevert(
        this.vaultInst.transferOwnership(owner, {from: other}),
        'StakingOwnable: caller is not the owner'
      );
    });
    it('access error', async function () {
      await expectRevert(
        this.vaultInst.vaultWithdraw("100", {from: owner}),
        'StakingOwnable: caller is not the owner'
      );
      await expectRevert(
        this.vaultInst.vaultWithdraw("100", {from: other}),
        'StakingOwnable: caller is not the owner'
      );
    });
    it('insufficient funds', async function () {
      var vault = await Vault.new();

      await expectRevert(
        vault.vaultWithdraw("100", {from: owner}),
        'Vault: insufficient funds in the vault'
      );
    });
  });

  
    


});
