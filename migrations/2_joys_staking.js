const Vault = artifacts.require("Vault");
const JoysStaking = artifacts.require("JoysStaking");

module.exports = async function(deployer, network, accounts) {
  let newMinimalStake;
  let newStartedStakeholdersLimit;
  let newNextStakeholdersLimit;

  if (network == "toys") {
    newMinimalStake = web3.utils.toWei("521000",'ether');
    newStartedStakeholdersLimit = "10";
    newNextStakeholdersLimit = "11";
  } else
  if (network == "joys-test") {
    newMinimalStake = web3.utils.toWei("100",'ether');
    newStartedStakeholdersLimit = "4";
    newNextStakeholdersLimit = "5";
  } else
  if (network == "joys-production") {
    newMinimalStake = web3.utils.toWei("521000",'ether');
    newStartedStakeholdersLimit = "50";
    newNextStakeholdersLimit = "100";
  } else {
    newMinimalStake = web3.utils.toWei("1",'ether');
    newStartedStakeholdersLimit = "4";
    newNextStakeholdersLimit = "5";
  }
  
  await deployer.deploy(Vault);
  const vaultAddress = (await Vault.deployed()).address;

  await deployer.deploy(JoysStaking, newMinimalStake, newStartedStakeholdersLimit, newNextStakeholdersLimit, vaultAddress);
  let joysStakingAddress = (await JoysStaking.deployed()).address;

  (await Vault.at(vaultAddress)).transferOwnership(joysStakingAddress);

};