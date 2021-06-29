# Joys staking smart contract

[![Testing](https://github.com/Joys-digital/staking-contract/actions/workflows/testing.yaml/badge.svg)](https://github.com/Joys-digital/staking-contract/actions/workflows/testing.yaml)
[![codecov](https://codecov.io/gh/Joys-digital/staking-contract/branch/master/graph/badge.svg?token=4B7AYDKXHS)](https://codecov.io/gh/Joys-digital/staking-contract)
[![Docs](https://img.shields.io/badge/docs-%F0%9F%93%84-success)](https://joys-digital.github.io/staking-contract/)

**Smart contract for staking native tokens**

- Lang: Solidity v0.6.12

- Project framework: truffle v5.3.7 (core: 5.3.7)

## Overview

### Deployed

< Coming soon >

### Documentation

< Coming soon >
<!-- [Generated html documentation](https://joys.gitlab.io/joys-research/joys-sc-loyalty/contracts/) -->

### Project structure:

```
contracts
├── Migrations.sol
├── interfaces
│   └── IVault.sol
├── main
│   ├── JoysStaking.sol
│   ├── Stakeholder.sol
│   ├── StakingMechanics.sol
│   └── Vault.sol
└── utils
    └── StakingOwnable.sol
```

- __interface/__ - Interfaces for compatibility with other smart contracts

- __main/__ - Core contracts of the system

- __utils/__ - Auxiliary contacts

### Architecture

<!-- ![inheritance picture 1](./img/architecture.png) -->
< Coming soon >

## Installation & Usage

Install all packages
```
npm i --save-dev
```

### Build project:

```
npm run build
```

### Testing

run ganache-cli with port 8545
```
npm test
```

### Test coverage
```
npm run coverage
```

### Run linters

```
npm run lint
```

## License

MIT License
