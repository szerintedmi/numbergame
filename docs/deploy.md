
# Compile, deploy & run, detailed instructions
## on testrpc
### 1. [testrpc](https://github.com/ethereumjs/testrpc)
 * `npm run testrpc:start`
 * or w/o npm:  
   `./runtestrpc.sh)`  
_it runs testrpc with mnemonic (ethereum bridge will deploy the contract to the same address which is currently hardcoded in NumberGame.sol), and with a predefined set of accounts with balances for unit tests_  
  * or to launch in docker:  
   ```
   npm run testrpc:docker:build
   npm run testrpc:start
   ```

### 2.  [Ethereum bridge](https://github.com/oraclize/ethereum-bridge)  
  ```
  npm run bridge:start
  ```  
  or
  ```
  cd ethereum-bridge
  n use 7.10.0 bridge -H localhost:8545 -a 9 --dev
  ```  
For next step wait for Oraclize Address Resolver to be deployed, look for output:  
`[2017-06-05T11:54:53.848Z] INFO address resolver (OAR) deployed to: 0x6f485c8bf6fc43ea212e93bbf8ce046c7f1cb475`
### 3. compile and deploy solidity contracts
```
npm start truffle:migrate
```
 or `truffle migrate`
### 3. webpack
```
npm run dev
````
## On local chain
TODO: not tested yet

## On test network
TODO: not tested yet
