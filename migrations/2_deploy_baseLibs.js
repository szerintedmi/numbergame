var stringUtilsLib = artifacts.require("./stringUtilsLib.sol");
var itMapsLib = artifacts.require("./itMapsLib.sol");
var strings = artifacts.require("./solidity-stringutils/strings.sol")

module.exports = function(deployer) {
  deployer.deploy(stringUtilsLib);
  deployer.deploy(itMapsLib);
  deployer.deploy(strings);
  
};
