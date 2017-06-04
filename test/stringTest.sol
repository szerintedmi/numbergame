/* TODO: this is not a working TEST! , just saved some tests */
pragma solidity ^0.4.8;

import "./stringUtilsLib.sol";
import "./solidity-stringutils/strings.sol"; // github.com/Arachnid/solidity-stringutils/strings.sol
import "./itMapsLib.sol";

contract test {

    using strings for *;
    using itMaps for itMaps.itMapUintAddress;
    itMaps.itMapUintAddress im_seenOnce;

    function insertMeToMap(uint _key) returns (bool replaced) {
        return im_seenOnce.insert(_key, msg.sender);
    }

    function removefromMap(uint _key) returns (bool success) {
        return im_seenOnce.remove(_key);
    }

    function getMapSize() returns (uint size) {
        return im_seenOnce.size();
    }

    function mapContains(uint _key) returns (bool exists ) {
        return im_seenOnce.contains(_key);
    }

    function getMapValue(uint _key) returns (address value ) {
        return im_seenOnce.get(_key);
    }

    /* function part2Test(string result) returns (uint ret) {

        uint betNumber;
        strings.slice memory s = result.toSlice();
        strings.slice memory part;
        // part and return value is first before :
        string memory arg1 = s.split(":".toSlice(), part).toString();
        // var arg2 = s.split(".".toSlice(), part); // part and return value is next after :
        // stringToUint returns 0 if can't convert which is fine as it will be treated as invalid bet
        // CHECK: stringToUint returns 123 for "as1fsd2dsfsdf3asd" Can it cause any issue?
        betNumber = stringUtilsLib.stringToUint(arg1);

     return betNumber;
    } */

    function part1Test(string result) returns (string res) {

       strings.slice memory s = result.toSlice();
        strings.slice memory part;
        string memory arg1 = s.split(":".toSlice(), part).toString();


     return arg1;
    }

    /* function toUintTest(string inp) returns (uint res) {
        return stringUtilsLib.stringToUint(inp);
    } */

    function parseIntTest(string inp, uint _decimals) returns (uint res) {
        return stringUtilsLib.parseInt(inp, _decimals);
    }

    // Copyright (c) 2015-2016 Oraclize srl, Thomas Bertani
function parseInt(string _a, uint _b)  returns (uint) {
  bytes memory bresult = bytes(_a);
  uint mint = 0;
  bool decimals = false;
  for (uint i = 0; i < bresult.length; i++) {
    if ((bresult[i] >= 48) && (bresult[i] <= 57)) {
      if (decimals) {
        if (_b == 0) break;
          else _b--;
      }
      mint *= 10;
      mint += uint(bresult[i]) - 48;
    } else if (bresult[i] == 46) decimals = true;
  }
  return mint;
}
}
