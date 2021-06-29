const { constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

const Vault = artifacts.require("Vault");
const JoysStaking = artifacts.require("JoysStaking");


contract('Ownable', function (accounts) {
  const [ owner, other ] = accounts;

  const minimalStake = web3.utils.toWei("1",'ether');;
  const stakeholdersLimit = "4";
  const nextStakeholdersLimit = "5";

  beforeEach(async function () {
    this.vaultInst = await Vault.new();
    this.ownable = await JoysStaking.new(minimalStake, stakeholdersLimit, nextStakeholdersLimit, this.vaultInst.address);
  });

  it('has an owner', async function () {
    expect(await this.ownable.owner()).to.equal(owner);
  });

  describe('transfer ownership', function () {
    it('changes owner after transfer', async function () {
      const receipt = await this.ownable.transferOwnership(other, { from: owner });
      expectEvent(receipt, 'OwnershipTransferred');

      expect(await this.ownable.owner()).to.equal(other);
    });

    it('prevents non-owners from transferring', async function () {
      await expectRevert(
        this.ownable.transferOwnership(other, { from: other }),
        'Ownable: caller is not the owner',
      );
    });

    it('guards ownership against stuck state', async function () {
      await expectRevert(
        this.ownable.transferOwnership(ZERO_ADDRESS, { from: owner }),
        'Ownable: new owner is the zero address',
      );
    });
  });

});
