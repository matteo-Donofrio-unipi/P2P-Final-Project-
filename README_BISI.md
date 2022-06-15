# VES - Valadilène Election System
## Peer to Peer Systems and Blockchains
## Academic Year 2020/2021
### Final Project by Giuseppe Bisicchia 559033

## Tools

- **NodeJS**
    - [lite-server](https://www.npmjs.com/package/lite-server) package, for development
- **Ethereum**, Solidity
    - [Truffle](https://truffleframework.com/truffle) framework, for smart contract compilation and migration
    - [Metamask](https://metamask.io/), Ethereum client
    - [Ganache](https://truffleframework.com/ganache), local blockchain for development
- **Front End**, Javascript
    - JQuery
    - Bootstrap
    - [Web3js](https://github.com/ethereum/web3.js/)
    - [Truffle-Contract](https://www.npmjs.com/package/@truffle/contract), web3 smart contract high level abstractions

## Install

Install nodeJS
Install Metamask and Ganache
`npm install -g truffle`
`npm install` to install nodejs project dependencies (web3, lite-server and truffle-contract)

## Setup workflow

- Run Ganache
- Login with Metamask and connect to local network (provided by Ganache)
- If any local accounts, import account from Ganache to Metamask (copy the private key to Metamask): the "imported" keyword should appear next to the account
- Reset account if already used (this action resets the nonce attached to the account: for example, perfoming transactions compute this nonce, so if you start Ganache again and you will use an already existing account with transaction history you will get error for bad nonce)
- `truffle compile`
- `truffle migrate --reset` (Ganache should be running)
- `npm run dev` to run lite-server (opens index.html)

## Unit Test
- `truffle test` to execute sveral scenarios to assess the smart contract's functionalities

## Structure

- `.\contracts`: the contracts used in the project
- `.\migrations`: the script to setup and run the contracts (if the `SCENARIO` constant inside `.\migrations\2_deploy.js` is `true` then an automatic scenario is executed)
- `.\src`: the web site files
- `.\test`: the unit test script

