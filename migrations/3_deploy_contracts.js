var NumberGame = artifacts.require("./NumberGame.sol");
var nGameLib = artifacts.require("./nGameLib.sol");
var stringUtilsLib = artifacts.require("./stringUtilsLib.sol");
var itMapsLib = artifacts.require("./itMapsLib.sol");
var strings = artifacts.require("./solidity-stringutils/strings.sol")

module.exports = function(deployer) {
  deployer.link(itMapsLib, nGameLib);
  deployer.deploy(nGameLib);

  deployer.link(nGameLib, NumberGame);

  deployer.link(stringUtilsLib, NumberGame);
  deployer.link(itMapsLib, NumberGame);
  deployer.link(strings, NumberGame);

  deployer.deploy(NumberGame);
};
