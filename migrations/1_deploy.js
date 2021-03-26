const Staking = artifacts.require("Staking");

module.exports = async function(deployer, network, accounts) {
    await deployer.deploy(Staking, 1000, { value: "10000000000" });
    
};