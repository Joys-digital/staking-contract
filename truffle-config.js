const HDWalletProvider = require("@truffle/hdwallet-provider");

// get private key from env
// use 'export PRIVATE_KEY=<you private key>' in console
let privateKey = ""
const getEnv = env => {
  const value = process.env[env];
  if (typeof value === 'undefined') {
    console.log(`${env} has not been set.`);
  }
  return value;
};
privateKey = getEnv('PRIVATE_KEY');

module.exports = {
  plugins: ["solidity-coverage"],

  networks: {
    ganache: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*",
    },
    joysPoas: {
      provider: function() {
        return new HDWalletProvider({
          privateKeys: [privateKey],
          providerOrUrl: "https://node-poas.joys.digital",
        });
      },
      network_id: "35855456",
      production: true
    },
    joysPow: {
      provider: function() {
        return new HDWalletProvider({
          privateKeys: [privateKey],
          providerOrUrl: "https://node.joys.digital",
        });
      },
      network_id: "35855456",
      production: true,
    },
    toys: {
      provider: function() {
        return new HDWalletProvider({
          privateKeys: [privateKey],
          providerOrUrl: "https://node.toys-pos.joys.cash/",
        });
      },
      network_id: "99415706",
      production: true,
      },
  },
    mocha: {
      reporter: 'eth-gas-reporter',
      reporterOptions: {
        excludeContracts: ['Migrations', 'StakeholderMock']
      }
    },
    solc: {
        optimizer: {
            enabled: true,
            runs: 200
        }
    },
  compilers: {
    solc: {
        version: "0.6.12", 
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            },
            evmVersion: "istanbul"
        }
    }
  }
};
