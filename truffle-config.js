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
    development: {
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
    kovan: {
      provider: function() {
        return new HDWallet(privateKey, `https://kovan.infura.io/v3/88459fc2d50c435e84d6852b9c87b436`);
      },
      network_id: 42,          // This network is yours, in the cloud.
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
          return new HDWallet(privateKey, `https://toys.joys.cash`);
        },
        network_id: 99415706,   // This network is yours, in the cloud.
        production: true        // Treats this network as if it was a public net. (default: false)
      },
  },
    mocha: {
        reporter: 'eth-gas-reporter',
        reporterOptions : {
            currency: 'USD',
            gasPrice: 6
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
