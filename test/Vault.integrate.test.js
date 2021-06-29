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
  });


  describe('positive', function () {
    it('correct staking contract', async function () {
      await assert.equal(
        await this.vaultInst.stakingContract(),
        this.joysStakingInst.address
      );
    });
  });

  describe('negative', function () {
    it('already registered', async function () {
      await expectRevert(
        this.vaultInst.register({from: owner}),
        'Vault: already registered'
      );
    });
    it('access error', async function () {
      await expectRevert(
        this.vaultInst.vaultWithdraw("100", {from: owner}),
        'Vault: access error'
      );
    });
    it('insufficient funds', async function () {
      var vault = await Vault.new();
      await vault.register({from: owner});

      await expectRevert(
        vault.vaultWithdraw("100", {from: owner}),
        'Vault: insufficient funds in the vault'
      );
    });
  });

  
    


});
