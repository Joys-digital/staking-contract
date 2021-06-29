const HDWallet = require('truffle-hdwallet-provider');

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
      host: "127.0.0.1",  // Localhost (default: none)
      port: 8545,         // Standard Ethereum port (default: none)
      network_id: "*",    // Any network (default: none)
    },
    production: {
      provider: function() {
        return new HDWallet(privateKey, `http://127.0.0.1:8545`);
      },
      network_id: 1,          // This network is yours, in the cloud.
      production: true        // Treats this network as if it was a public net. (default: false)
    },
    joys: {
      provider: function() {
        return new HDWallet(privateKey, `https://node.joys.digital`);
      },
      network_id: 35855456,   // This network is yours, in the cloud.
      production: true        // Treats this network as if it was a public net. (default: false)
    },
    toys: {
        provider: function() {
          return new HDWallet(privateKey, `https://node.toys-pos.joys.cash/`);
        },
        network_id: 99415706,   // This network is yours, in the cloud.
        production: true,        // Treats this network as if it was a public net. (default: false)
        gasPrice: 40000000000
      },
  },
    mocha: {
      reporter: 'eth-gas-reporter',
      reporterOptions: {
        excludeContracts: ['Migrations']
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
