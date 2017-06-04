pragma solidity ^0.4.8;

import "./itMapsLib.sol";

library nGameLib {

  /* TODO: hove to structrure this? what data/logic shall we move here? */

  using itMapsLib for itMapsLib.itMapAddressUint;
  using itMapsLib for itMapsLib.itMapUintAddress;
  using itMapsLib for itMapsLib.itMapUintBool;

  struct Game {
      Round[] rounds;
      ResultCalcHelper resultCalcHelper;
      uint latestRoundId; // idx in rounds, starting with 0
      uint nextRoundLength; // in seconds minutes;
      uint nextRoundRequiredBetAmount; // in Wei
      uint nextRoundFee; // parts per million , ie. 10,000 = 1%
  }

  struct ResultCalcHelper {
    /* temporary structure to calculate results - can't be in memory because can't create mappings and dynamic arrays in memory
    TODO: CHECK: could it be done without storage ??  */
    itMapsLib.itMapUintAddress im_seenOnce; // Key:betnumber -> Value:PlayerAddress
    itMapsLib.itMapUintBool im_seenMultiple; // Key:betnumber => Value:seen (bool)
                                          // mapping(uint=>bool) m_seenMultiple; would be enough to calc results
                                          // but it needs to be itmap to be able to clear after round.
  }

  struct Round {
       // playeraddress => bet number , bet number is 0 until revealed
      itMapsLib.itMapAddressUint im_bets;
      // callback queryId => player address : used for retrieving playerAddress at __callback
      mapping(bytes32=>address) m_queries;
      uint requiredBetAmount;
      uint revealedBetCount;
      uint smallestNumber;
      uint revealTime;
      uint roundLength;
      uint fee;
      address winningAddress;
      bool isActive;
  }

  function _startNewRound(Game storage self) returns (uint newRoundId) {
    // CHECK: error handling (do we need to return an error code if it fails?)
    // CHECK: is it OK if anyone can call it? it needed to be able to start new round from first bet
    // This is called from the constructor or with the first bet

    if (self.rounds.length != 0 && self.rounds[self.latestRoundId].isActive) {
        // the previous one should be inactive to start a new one
       throw;
    }

    itMapsLib.itMapAddressUint memory im; // CHECK: memory???
    newRoundId = self.rounds.push( nGameLib.Round( {
        im_bets: im,
        isActive: true,
        winningAddress: address(0),
        smallestNumber: 0,
        roundLength: self.nextRoundLength,
        revealTime: now + self.nextRoundLength,
        requiredBetAmount: self.nextRoundRequiredBetAmount,
        revealedBetCount: 0,
        fee: self.nextRoundFee
    }));

    self.latestRoundId = newRoundId -1;

    return self.latestRoundId;
  }

  function updateResults(Game storage self, uint _roundId) returns (uint numberOfUnrevealedOrInvalidBets) {
      Round storage _round = self.rounds[_roundId];
      ResultCalcHelper storage _resultCalcHelper = self.resultCalcHelper;
      uint numberOfBets = _round.im_bets.size() ;
      uint numberToCheck;

      // collect unique betnumbers in seenOnce from all bets (im_bets)
      for(uint i = 0; i < numberOfBets  ; i++) {
          numberToCheck = _round.im_bets.getValueByIndex(i); // CHECK: does it overwrite value in im_bets?
          if(numberToCheck > 0) { // if this bid has been already revealed and valid...
            if (_resultCalcHelper.im_seenMultiple.contains(numberToCheck) ) {
              continue;
            }
            if (_resultCalcHelper.im_seenOnce.contains(numberToCheck)) {
              _resultCalcHelper.im_seenOnce.remove(numberToCheck);
              _resultCalcHelper.im_seenMultiple.insert(numberToCheck, true);
            } else {
              // first occurence, add to seenOnce
              _resultCalcHelper.im_seenOnce.insert( numberToCheck, _round.im_bets.getKeyByIndex(i));
            }
          } else {
              numberOfUnrevealedOrInvalidBets++ ;
          } // numberToCheck
      } // for

      // find smallestNumber in seenOnce
      _round.winningAddress = address(0);
      _round.smallestNumber = 0;
      uint seenOnceCount = _resultCalcHelper.im_seenOnce.size();
      for( i=0; i < seenOnceCount; i++) {
        numberToCheck = _resultCalcHelper.im_seenOnce.getKeyByIndex(i);
        if (numberToCheck < _round.smallestNumber || _round.smallestNumber == 0) {
          _round.smallestNumber = numberToCheck;
          _round.winningAddress = _resultCalcHelper.im_seenOnce.getValueByIndex(i);
        }
      }
      // Clean up
      // CHECK: is it the best way? ie. shall we just set array lengthto zero? (im_seenOnce.clear())
      //    https://ethereum.stackexchange.com/questions/14017/solidity-how-could-i-apply-delete-to-complete-storage-ref-with-one-call
      _resultCalcHelper.im_seenOnce.destroy();
      _resultCalcHelper.im_seenMultiple.destroy();
      return numberOfUnrevealedOrInvalidBets;
  } // updateResults

}
