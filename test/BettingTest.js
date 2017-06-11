var NumberGame = artifacts.require("./NumberGame.sol");
var BigNumber = require('bignumber.js');

contract("NumberGame", function(accounts) {
  /* TODO: add  tests for
      - invalid bets tests: guess with 0, from same account, with invalid value (perhaps to separate .js)
      - getBet ( revealed and unreavealed phase)
      - one assert somewhere for getTotalPot
      - one reveal with real Oraclize callback?
  */

  // TODO: create a testnumber factory function for load tests? use a number => { .. } mapping instead?
  var testNumbers = [
    { submittedGuess: 0, encryptedBet: 'need to generate this if want oraclize decrypt but it will work with manual reveal', betWithSalt: '0:RM/MhzlFttk/dA=='},
    { submittedGuess: 1, encryptedBet: 'BEw9GtMPqUOMYHkaS/Nabtrs4aOvirnk9hFl5v0ljaQONjv8Jh0EjASLdK4V4YOU+NB0GvNO2M0bKSWb8RthvgbluzvIzQVGv6Q+/X53chHbZKxytHoYMziw4Vuu7HoU5vvU', betWithSalt: '1:RM/MhzlFttk/dA=='},
    { submittedGuess: 2, encryptedBet: 'BMZgdLRGpUR8HceDkDIqUR94XWHKGqtEcWZwe1QkhIUhtWyvDoo84J6uURTjCCXqgCFldQjRixPL+jlShcjX6T0Y4MsEh5ZZ2VHpVENql291G/Es5vL4j8cynGlGj1JJLelO', betWithSalt: '2:PRxyFcSy+tDbbw=='},
    { submittedGuess: 3, encryptedBet: 'BHQtsam2TMxzXNUTWUApJp331G58kkKvfuBQA8KbAW9eGNlbVKc2OL32rJn0xHa5iGOmnZuXObajFcGpKoe+vRWaOFtHklCBEQMikxH6sWhcgMuVr74bfkUWP2ctomoyFM3B', betWithSalt: '3:nK4PZjwkBl6huQ=='},
    { submittedGuess: 4, encryptedBet: 'BH2aVALMvBNQCbjBXBmJWhWsrB5JNmqe/Ehdp/1AdDmFWzYH9vaBzzL/T9rBYah31k9oA/Nge0a6iixLrDg0Yl9jQzCAOvWCSy+bz1SV75ycqc4G3gF6xCD5PpsWcamqVgvV', betWithSalt: '4:2k6155fpE1ChPQ=='},
    { submittedGuess: 5, encryptedBet: 'BEJQaW4+OgzpVNW112F/hXWoOR8sMCeggt5VdR4xL8lI61LGKxDoPvZCsKyVDprgBjIbkv/wOvrLDPw/pcsXkRiRmyHGlWTYgPNx80hLzfgFr+g7cZXcGo+tRhLjSUxUd6Pz', betWithSalt: '5:dP3Zi9a/qDiOlg=='},
    { submittedGuess: 6, encryptedBet: 'BAslaNuYyVp55h+ig0WHOprbwuKbBUEnGiBXjMA2UgeD7+ukVmMf7jCW7GdzTwXDpbMToJmPZTeXMCxumDwhUG8966ep2nB0IvyU8pGbsiIkUCFe8tRvFkjB26XJjC73oifV', betWithSalt: '6:m9kTSzH6X+eJWQ=='},
    { submittedGuess: 7, encryptedBet: 'BOHaLUDTRESBu1vQl3adswNeWywHZNAs082LjbvUjEbmIrWMmfSgFd2Nif0XDPMyuqUuBWCGtALkBPrTCt6sdNUeD3qIzDodfQlao/RlFnEELFHNrNEd5n+ayFWGu8zrZdCe', betWithSalt: '7:euRZmjYfR1b0Pw=='},
    { submittedGuess: 8, encryptedBet: 'BCSFrthxQBRRE2pg1ZRGH2YHybBqpdtyGT7n1Y8azSP/+Ls6w6fbYW1TePmxo1cTMuYgWmCzaa6hK5g69VzfMc6fF4bDQCC07g+tfD26e2pzVidHamjrvWr69XhgyKaeP5mi', betWithSalt: '8:3Cs2+epRLbl54g=='},
    { submittedGuess: 9, encryptedBet: 'BDZFB/kXpdUYFUZnE/wkVhTIwax6bYS/JVjVfyeUJeWKUClc1mkGFiooBnePONXSMUZdd9CfFyTisMJlCybY5oWofxbnvtze/NyWrmzXBVhqaJtUjOiNlEVf9T8/jCe9g2dV', betWithSalt: '9:LMC53kkz4s3CKg=='},
    { submittedGuess: 10, encryptedBet: 'BODAWnT6EHPR/3hzgwHFYFVelOYpvFCJpyiv6ImejkLCxofZwHhvGOAUNc90IzUKNajqgOzalAqUu2e15EostKA9zJL7FB5a/N3MwaKRl0ekIHPanZphHPtJIr+3rka5GS+aUQ==', betWithSalt: '10:unl4LN9fVnUOqA=='}
  ];

  var instance, ownerAddress;
  var oraclizeCbAddress;
  var gasUseLog = new Array();
  var queryId; // TODO: move this into scope

  /*********************************************
  * Generic place/reveal & logging functions
  **********************************************/

  function parseRoundInfo(result) {
    return {
      isActive: result[0],
      requiredBetAmount: result[1],
      revealTime: result[2].toNumber(),
      roundLength: result[3].toNumber(),
      betCount: result[4].toNumber(),
      revealedBetCount: result[5].toNumber(),
      unReveleadBetCount: result[6].toNumber(),
      invalidBetCount: result[7].toNumber(),
      winningAddress: result[8],
      smallestNumber: result[9].toNumber(),
      winnablePot: result[10],
      fee: result[11].toNumber()
    }
  }

  function logGasUse(tran, tx) {
    //gasUseLog.push(  tran + ', ' +  tx.receipt.gasUsed );
    gasUseLog.push(  [tran, tx.receipt.gasUsed ]);
    //console.log("Gas used at", location, tx.receipt.gasUsed);
  }

  var _placeBetFn = function ( bet) {
    // called for each placebet via  Promise.all() in placeBet(). adds queryId to bet struct
    return new Promise(resolve => resolve(
      instance.placeBet(bet.roundId, testNumbers[bet.number].encryptedBet, {from: bet.playerAddress, value: bet.amount})
      .then( function (tx) {
        bet.queryId = tx.logs[0].args._queryId ;
        logGasUse("placeBet. round: " + bet.roundId + " bet#: " + bet.idx,  tx);
        return tx;
      }) // placeBet
    )); // Promise
  }; _placeBetFn

  var _revealBetFn = function revealBet(bet) {
    // called for each placebet via  Promise.all() in placeBet(). adds queryId to bet struct
    return new Promise(resolve => resolve(
      instance.__callback(bet.queryId, testNumbers[bet.number].betWithSalt, {from: oraclizeCbAddress})
      .then( function (tx) {
        logGasUse("revealBet. round: " + bet.roundId + " bet#: " + bet.idx + " number: " + testNumbers[bet.number].submittedGuess ,  tx);
        return tx;
      }) // revealBet
    )); // Promise
  } // _revealBetFn

  function revealBets(roundId, bets) {
    var revealBetActions = bets.map(_revealBetFn);
    var results = Promise.all( revealBetActions );

    return results.then( function (revealsTxs) {
      return instance.getRoundInfo(roundId);
    }).then (function (roundInfoRes) {
        return parseRoundInfo(roundInfoRes);
    });
  } //revealBets()

  function placeBets(roundId, bets, betAmount) {
    // pass bets[] with  numbers to bet
    // passed argument array trasnformed int a struct array  with playeraccount & queryid etc.
    // returns parsed roundInfo

    for (var i = 0; i < bets.length ; i++){
      // add round id, betAmount, player account ref to accounts[] (idx+1 to avoid pollutin owner ac with transaction fees)
      // TODO: better way to pass these ?
      bets[i] = { number: bets[i], roundId: roundId, amount: betAmount, playerAddress: accounts[i+1], idx: i };
    }
    var placeBetActions = bets.map(_placeBetFn);
    var results = Promise.all( placeBetActions );

    return results.then( function (betsTxs) {
      return instance.getRoundInfo(roundId)
    }).then (function (roundInfoRes) {
        return parseRoundInfo(roundInfoRes);
    });
  } // placeBetFn

  /*********************************************
  * Tests starts here
  **********************************************/

  before(function() {
    NumberGame.deployed().then( contractInstance => {
      instance = contractInstance;
      return instance.getOraclizeCbAddress();
    }).then( res => {
      oraclizeCbAddress = res;
      //console.log("Oraclize callback address for mocked callbacks:", oraclizeCbAddress);
      return instance.owner();
    }).then( ownerRes => {
      ownerAddress = ownerRes;
      return ownerRes;
    });
  }) // before()

  it('should be possible to deposit money to contract', function(done) {
    var amount = new BigNumber ( web3.toWei(5));

    instance.sendTransaction({value: amount,
          address: instance.address, from: accounts[0] })
    .then( tx => {
      logGasUse("sendTransaction:", tx);
      assert.equal(tx.logs[0].event, 'e_fundsReceived', "event name should be set");
      assert.equal(tx.logs[0].args._from, accounts[0], "account in event should be set");
      assert.equal(tx.logs[0].args._amount.sub( amount), 0, "amount in event should be set");
      assert.equal( web3.eth.getBalance(instance.address).sub(amount), 0, 'The new balance should be correct');
      // printBalance("2. contract balance after money put inside", contractInstance.address);
      done();
    }); //sendTransaction()
  });  // should be possible to deposit money to contract

  it('should be possible to start a round', function(done) {
    var newLength = 86400; // we reveal manually in test
    var newFee = 10000; // 1%
    var newAmount = new BigNumber( web3.toWei(1));
    var roundId, revealTime;

    Promise.all( [
      instance.setNextRoundLength(newLength, {from: accounts[0]}).then( function(tx) {
        logGasUse("setNextRoundLength (for newRound)", tx);
      }),
      instance.setNextRoundFee(newFee, {from: accounts[0]}).then( function(tx) {
        logGasUse("setNextRoundFee (for newRound)", tx);
      }),
      instance.setNextRoundRequiredBetAmount(newAmount, {from: accounts[0]}).then( function(tx) {
        logGasUse("setNextRoundRequiredBetAmount (for newRound)", tx);
      })
    ]).then( txs => {
      return instance.startNewRound({from: accounts[1]});
    }).then( tx => {
      revealTime = Math.floor(Date.now() / 1000) + newLength;
      roundId = tx.logs[0].args._roundId;
      logGasUse("1st startRound, 1 bet ", tx);
      assert.equal(tx.logs[0].event, 'e_roundStarted', "event should be emmitted");
      assert.equal(tx.logs[0].args._requiredBetAmount.sub( newAmount), 0, "nextRoundRequiredBetAmount should be set");
      assert.isAtLeast(tx.logs[0].args._revealTime.toNumber(), revealTime -1 ), "revealTime should be as expected";
      assert.isAtMost(tx.logs[0].args._revealTime.toNumber(), revealTime +1 ), "revealTime should be as expected";
      return instance.getRoundInfo(roundId);
    }).then( roundInfoRes => {
        var round = parseRoundInfo(roundInfoRes);
        assert(round.isActive, "new round should be active");
        assert(round.requiredBetAmount.equals(newAmount), 0, "new round should have requiredBetAmount set");
        assert.isAtLeast(round.revealTime, revealTime -1 ), "revealTime should be as expected";
        assert.isAtMost(round.revealTime, revealTime +1 ), "revealTime should be as expected";
        assert.equal(round.roundLength, newLength, "new round should have roundLength set");
        assert.equal(round.betCount, 0, "new round betCount should be 0");
        assert.equal(round.revealedBetCount, 0, "new round revealedBetCount should be 0");
        assert.equal(round.unReveleadBetCount, 0, "new round unReveleadBetCount should be 0");
        assert.equal(round.invalidBetCount, 0, "new round invalidBetCount should be 0");
        assert.equal(round.winningAddress, 0, "new round winningAddress should be 0x0");
        assert.equal(round.smallestNumber, 0, "new round smallestNumber should be 0");
        assert(round.winnablePot.equals(0), "new round winnablePot should be 0");
        assert.equal(round.fee, newFee, "new round fee should be set");
        done();
      }); // Promise.all
  }); // should be possible to start a round

  it('should be possible to place 1 bet', function(done) {
    //it's dependent on the previous test with a new round
    var roundId = 0, betAmount = new BigNumber( web3.toWei(1)) ;
    var playerAddress = accounts[1];

    instance.placeBet(roundId, testNumbers[1].encryptedBet, {from: playerAddress, value: betAmount})
    .then( tx => {
      logGasUse("placeBet 1st", tx);
      assert.equal(tx.logs[0].event, 'e_betPlaced', "event should be emmitted");
      assert.equal(tx.logs[0].args._roundId.toNumber(), roundId, "roundId should be set");
      assert.equal(tx.logs[0].args._from, playerAddress, "from should be the sender");
      queryId = tx.logs[0].args._queryId;
      return instance.getRoundInfo(roundId);
    }).then( roundInfoRes => {
      var round = parseRoundInfo(roundInfoRes);
      assert.equal(round.betCount, 1, "new round betCount should be set");
      assert.equal(round.revealedBetCount, 0, "new round revealedBetCount should be 0");
      assert.equal(round.unReveleadBetCount, 1, "new round unReveleadBetCount should be set");
      assert.equal(round.invalidBetCount, 0, "new round invalidBetCount should be 0");
      assert.equal(round.winningAddress, 0, "new round winningAddress should be 0x0");
      assert.equal(round.smallestNumber, 0, "new round smallestNumber should be 0");
      assert(round.winnablePot.minus( betAmount.times(1-round.fee/1000000 ) ).equals( 0), "new round winnablePot should be set");
      assert.equal()
      done();
    }); // placeBet
  }); // should be possible to place 1 bet

  it('should be possible to reveal 1 bet', function(done) {
    //it's dependent on the previous test with 1 bet placed TODO: merge the two in order to remove need for global scope queryId
    var roundId = 0, winnerAddress = accounts[1], betAmount = new BigNumber( web3.toWei(1) );

    var winnerBalanceBefore = web3.eth.getBalance(winnerAddress);
    var ownerBalanceBefore = web3.eth.getBalance(ownerAddress);
    var contractBalanceBefore = web3.eth.getBalance(instance.address);
    instance.__callback(queryId , testNumbers[1].betWithSalt, {from: oraclizeCbAddress, gas: 4712100})
    .then( tx => {
      logGasUse("Reveal bet 1 - last (1 bet, winner)", tx);

      assert.equal(tx.logs[0].event, 'e_betRevealed', "event should be emmitted");
      assert.equal(tx.logs[0].args._roundId.toNumber(), roundId, "roundId should be set");
      assert.equal(tx.logs[0].args._from, winnerAddress, "_from should be player");
      assert.equal(tx.logs[0].args._queryId, queryId, "queryId  should be set");
      assert.equal(tx.logs[0].args._betNumber.toNumber(), 1, "betnumber  should be 1");

      assert.equal(tx.logs[1].event, 'e_roundClosed', "event should be emmitted");
      assert.equal(tx.logs[1].args._roundId.toNumber(), roundId, "roundId should be set");
      assert.equal(tx.logs[1].args._winnerAddress, winnerAddress, "winnerAddress should be player");
      assert.equal(tx.logs[1].args._winningNumber.toNumber(), 1, "winning number should be set");
      assert.equal(tx.logs[1].args._numberOfBets.toNumber(), 1, "numberofbets should be set");
      assert.equal(tx.logs[1].args._numberOfUnRevealedBets.toNumber(), 0, "unReveleadBetCouns should be 0");
      assert.equal(tx.logs[1].args._numberOfInvalidBets.toNumber(), roundId, "numberOfInvalidBets should be 0");

      return instance.getRoundInfo(roundId);
    }).then( roundInfoRes => {
      var roundInfo = parseRoundInfo(roundInfoRes);
      assert(!roundInfo.isActive, "the round shouldn't be active");
      assert.equal(roundInfo.revealedBetCount, 1, "new round revealedBetCount should be 1");
      assert.equal(roundInfo.unReveleadBetCount, 0, "new round unReveleadBetCount should be set");
      assert.equal(roundInfo.invalidBetCount, 0, "new round invalidBetCount should be 0");
      assert.equal(roundInfo.winningAddress, winnerAddress, "new round winningAddress should be set");
      assert.equal(roundInfo.smallestNumber, 1, "new round smallestNumber should be 1");
      var newWinnerBalance = web3.eth.getBalance(winnerAddress);
      var newOwnerBalance = web3.eth.getBalance(ownerAddress);
      var newContractBalance = web3.eth.getBalance(instance.address);
      var feeAmount = betAmount.times(roundInfo.fee/1000000 ) ;
      assert(newWinnerBalance.equals( winnerBalanceBefore.plus( roundInfo.winnablePot) ) , "winner should receive winnablePot" );
      assert(newOwnerBalance.equals( ownerBalanceBefore.plus(feeAmount) ), "owner should receive fee" );
      assert(newContractBalance.equals( contractBalanceBefore.minus(feeAmount).minus(roundInfo.winnablePot) ), "contract balance should be set");
      done();
    });
  }); // should be possible to reveal 1 bet

  it('should be possible to place & reveal bets (4 bets, winner)', function(done) {
    // it depends on previous test (set round params set and last round must be closed)
    var roundId, betAmount = new BigNumber(web3.toWei(1)) ;
    var betsToPlace = [2,8,5,2];
    var winnerAddress = accounts[3]; // bets mapped to players from accounts[1] to avoid polluting accounts[0] with tx fees
    var winnerBalanceBefore, ownerBalanceBefore, contractBalanceBefore, feeAmount, feeAmountPerPlayer;

    instance.startNewRound({from: accounts[0]})
    .then( tx => {
      logGasUse("2nd startRound (4 bet, winner)", tx);
      /*** PLACE BETS ***/
      roundId = tx.logs[0].args._roundId.toNumber();

      return placeBets(roundId, betsToPlace, betAmount);
    }).then( roundInfo => {
      feeAmount = betAmount.times( roundInfo.fee/1000000 * betsToPlace.length);
      feeAmountPerPlayer = betAmount.times( roundInfo.fee/1000000 );
      assert.equal(roundInfo.betCount, betsToPlace.length, "new round betCount should be set");
      assert.equal(roundInfo.revealedBetCount, 0, "new round revealedBetCount should be 0");
      assert.equal(roundInfo.unReveleadBetCount, betsToPlace.length, "new round unReveleadBetCount should be set");
      assert.equal(roundInfo.invalidBetCount, 0, "new round invalidBetCount should be 0");
      assert.equal(roundInfo.winningAddress, 0, "new round winningAddress should be 0x0");
      assert.equal(roundInfo.smallestNumber, 0, "new round smallestNumber should be 0");
      assert.equal(roundInfo.winnablePot, (1-roundInfo.fee/1000000 )* betAmount *betsToPlace.length, "new round winnablePot should be set");

      winnerBalanceBefore = web3.eth.getBalance(winnerAddress);
      ownerBalanceBefore = web3.eth.getBalance(ownerAddress);
      contractBalanceBefore = web3.eth.getBalance(instance.address);
    /*** REVEAL BETS ***/
      return revealBets(roundId, betsToPlace);
    }).then( roundInfo => {
      assert.equal(roundInfo.betCount, betsToPlace.length, "round betCount should be set");
      assert.equal(roundInfo.revealedBetCount, betsToPlace.length, "round revealedBetCount should be set");
      assert.equal(roundInfo.unReveleadBetCount, 0, "round unReveleadBetCount should be set");
      assert.equal(roundInfo.invalidBetCount, 0, "round invalidBetCount should be 0");
      assert.equal(roundInfo.winningAddress, winnerAddress, "round winningAddress should be set");
      assert.equal(roundInfo.smallestNumber, 5, "round smallestNumber should be set");
      assert(!roundInfo.isActive, "round should not be active");
      var newWinnerBalance = web3.eth.getBalance(winnerAddress);
      var newOwnerBalance = web3.eth.getBalance(ownerAddress);
      var newContractBalance = web3.eth.getBalance(instance.address);

      assert(newWinnerBalance.equals( winnerBalanceBefore.plus(roundInfo.winnablePot) ), "winner should receive winnablePot" );
      assert(newOwnerBalance.equals( ownerBalanceBefore.plus(feeAmount) ), "owner should receive fee" );
      assert(newContractBalance.equals(contractBalanceBefore.minus(feeAmount).minus(roundInfo.winnablePot)), "contract balance should be set");
      done();
    }); //
  }); // should be possible to place & reveal bets (4 bet, winner)

  it('should be possible to place & reveal bets (4 bets, no winner)', function(done) {
    // it depends on previous test (set round params set and last round must be closed)
    var roundId, betAmount = new BigNumber( web3.toWei(1));
    var betsToPlace = [2,3,2,3];
    var winnerAddress = 0;
    var playerBalanceBefore, ownerBalanceBefore, contractBalanceBefore, feeAmount, feeAmountPerPlayer;

    instance.startNewRound({from: accounts[0]})
    .then( tx => {
      logGasUse("3nd startRound (4 bet, no winner)", tx);
      /*** PLACE BETS ***/
      roundId = tx.logs[0].args._roundId.toNumber();
      return placeBets(roundId, betsToPlace, betAmount);
    }).then( roundInfo => {
      feeAmount = betAmount.times( roundInfo.fee/1000000 * betsToPlace.length);
      feeAmountPerPlayer = betAmount.times( roundInfo.fee/1000000 );
      assert.equal(roundInfo.betCount, betsToPlace.length, "new round betCount should be set");
      assert.equal(roundInfo.revealedBetCount, 0, "new round revealedBetCount should be 0");
      assert.equal(roundInfo.unReveleadBetCount, betsToPlace.length, "new round unReveleadBetCount should be set");
      assert.equal(roundInfo.invalidBetCount, 0, "new round invalidBetCount should be 0");
      assert.equal(roundInfo.winningAddress, 0, "new round winningAddress should be 0x0");
      assert.equal(roundInfo.smallestNumber, 0, "new round smallestNumber should be 0");
      assert(roundInfo.winnablePot.equals( betAmount.times(betsToPlace.length).minus(feeAmount) ), "new round winnablePot should be set");

      playerBalanceBefore = web3.eth.getBalance(accounts[1]);
      ownerBalanceBefore = web3.eth.getBalance(ownerAddress);
      contractBalanceBefore = web3.eth.getBalance(instance.address);
    /*** REVEAL BETS ***/
      return revealBets(roundId, betsToPlace);
    }).then( roundInfo => {
      assert.equal(roundInfo.betCount, betsToPlace.length, "round betCount should be set");
      assert.equal(roundInfo.revealedBetCount, betsToPlace.length, "round revealedBetCount should be set");
      assert.equal(roundInfo.unReveleadBetCount, 0, "round unReveleadBetCount should be set");
      assert.equal(roundInfo.invalidBetCount, 0, "round invalidBetCount should be 0");
      assert.equal(roundInfo.winningAddress, winnerAddress, "round winningAddress should be set");
      assert.equal(roundInfo.smallestNumber, 0, "round smallestNumber should be set");
      assert(!roundInfo.isActive, "round should not be active");
      var newPlayerBalance = web3.eth.getBalance(accounts[1]);
      var newOwnerBalance = web3.eth.getBalance(ownerAddress);
      var newContractBalance = web3.eth.getBalance(instance.address);

      assert(newPlayerBalance.equals( playerBalanceBefore.plus(betAmount).minus(feeAmountPerPlayer) ), "player should get back bet less fees" );
      assert(newOwnerBalance.equals( ownerBalanceBefore.plus(feeAmount) ), "owner should receive fee" );
      assert(newContractBalance.equals( contractBalanceBefore.minus( feeAmount).minus( roundInfo.winnablePot)), "contract balance should be set");
      done();
    }); //
  }); // should be possible to place & reveal bets (4 bet, no winner)

  it('should be possible to place & reveal bets (10 bets, winner)', function(done) {
    // it depends on previous test (set round params set and last round must be closed)
    var roundId, betAmount = new BigNumber(web3.toWei(1)) ;
    var betsToPlace = [2,8,5,2,6,7,6,5,6,7];
    var winnerAddress = accounts[2]; // bets mapped to players from accounts[1] to avoid polluting accounts[0] with tx fees
    var winnerBalanceBefore, ownerBalanceBefore, contractBalanceBefore, feeAmount, feeAmountPerPlayer;

    instance.startNewRound({from: accounts[0]})
    .then( tx => {
      logGasUse("4th startRound (10 bets, winner)", tx);
      /*** PLACE BETS ***/
      roundId = tx.logs[0].args._roundId.toNumber();

      return placeBets(roundId, betsToPlace, betAmount);
    }).then( roundInfo => {
      feeAmount = betAmount.times( roundInfo.fee/1000000 * betsToPlace.length);
      feeAmountPerPlayer = betAmount.times( roundInfo.fee/1000000 );
      assert.equal(roundInfo.betCount, betsToPlace.length, "new round betCount should be set");
      assert.equal(roundInfo.revealedBetCount, 0, "new round revealedBetCount should be 0");
      assert.equal(roundInfo.unReveleadBetCount, betsToPlace.length, "new round unReveleadBetCount should be set");
      assert.equal(roundInfo.invalidBetCount, 0, "new round invalidBetCount should be 0");
      assert.equal(roundInfo.winningAddress, 0, "new round winningAddress should be 0x0");
      assert.equal(roundInfo.smallestNumber, 0, "new round smallestNumber should be 0");
      assert.equal(roundInfo.winnablePot, (1-roundInfo.fee/1000000 )* betAmount *betsToPlace.length, "new round winnablePot should be set");

      winnerBalanceBefore = web3.eth.getBalance(winnerAddress);
      ownerBalanceBefore = web3.eth.getBalance(ownerAddress);
      contractBalanceBefore = web3.eth.getBalance(instance.address);
    /*** REVEAL BETS ***/
      return revealBets(roundId, betsToPlace);
    }).then( roundInfo => {
      assert.equal(roundInfo.betCount, betsToPlace.length, "round betCount should be set");
      assert.equal(roundInfo.revealedBetCount, betsToPlace.length, "round revealedBetCount should be set");
      assert.equal(roundInfo.unReveleadBetCount, 0, "round unReveleadBetCount should be set");
      assert.equal(roundInfo.invalidBetCount, 0, "round invalidBetCount should be 0");
      assert.equal(roundInfo.winningAddress, winnerAddress, "round winningAddress should be set");
      assert.equal(roundInfo.smallestNumber, 8, "round smallestNumber should be set");
      assert(!roundInfo.isActive, "round should not be active");
      var newWinnerBalance = web3.eth.getBalance(winnerAddress);
      var newOwnerBalance = web3.eth.getBalance(ownerAddress);
      var newContractBalance = web3.eth.getBalance(instance.address);

      assert(newWinnerBalance.equals( winnerBalanceBefore.plus(roundInfo.winnablePot) ), "winner should receive winnablePot" );
      assert(newOwnerBalance.equals( ownerBalanceBefore.plus(feeAmount) ), "owner should receive fee" );
      assert(newContractBalance.equals(contractBalanceBefore.minus(feeAmount).minus(roundInfo.winnablePot)), "contract balance should be set");
      done();
    }); //
  }); // should be possible to place & reveal bets (10 bets, winner)

  it('should be possible to place & reveal bets (10 bets, no winner)', function(done) {
    // it depends on previous test (set round params set and last round must be closed)
    var roundId, betAmount = new BigNumber( web3.toWei(1));
    var betsToPlace = [2,3,6,5,9,3,9,5,6,2];
    var winnerAddress = 0;
    var playerBalanceBefore, ownerBalanceBefore, contractBalanceBefore, feeAmount, feeAmountPerPlayer;

    instance.startNewRound({from: accounts[0]})
    .then( tx => {
      logGasUse("5th startRound (10 bets, no winner)", tx);
      /*** PLACE BETS ***/
      roundId = tx.logs[0].args._roundId.toNumber();
      return placeBets(roundId, betsToPlace, betAmount);
    }).then( roundInfo => {
      feeAmount = betAmount.times( roundInfo.fee/1000000 * betsToPlace.length);
      feeAmountPerPlayer = betAmount.times( roundInfo.fee/1000000 );
      assert.equal(roundInfo.betCount, betsToPlace.length, "new round betCount should be set");
      assert.equal(roundInfo.revealedBetCount, 0, "new round revealedBetCount should be 0");
      assert.equal(roundInfo.unReveleadBetCount, betsToPlace.length, "new round unReveleadBetCount should be set");
      assert.equal(roundInfo.invalidBetCount, 0, "new round invalidBetCount should be 0");
      assert.equal(roundInfo.winningAddress, 0, "new round winningAddress should be 0x0");
      assert.equal(roundInfo.smallestNumber, 0, "new round smallestNumber should be 0");
      assert(roundInfo.winnablePot.equals( betAmount.times(betsToPlace.length).minus(feeAmount) ), "new round winnablePot should be set");

      playerBalanceBefore = web3.eth.getBalance(accounts[1]);
      ownerBalanceBefore = web3.eth.getBalance(ownerAddress);
      contractBalanceBefore = web3.eth.getBalance(instance.address);
    /*** REVEAL BETS ***/
      return revealBets(roundId, betsToPlace);
    }).then( roundInfo => {
      assert.equal(roundInfo.betCount, betsToPlace.length, "round betCount should be set");
      assert.equal(roundInfo.revealedBetCount, betsToPlace.length, "round revealedBetCount should be set");
      assert.equal(roundInfo.unReveleadBetCount, 0, "round unReveleadBetCount should be set");
      assert.equal(roundInfo.invalidBetCount, 0, "round invalidBetCount should be 0");
      assert.equal(roundInfo.winningAddress, winnerAddress, "round winningAddress should be set");
      assert.equal(roundInfo.smallestNumber, 0, "round smallestNumber should be set");
      assert(!roundInfo.isActive, "round should not be active");
      var newPlayerBalance = web3.eth.getBalance(accounts[1]);
      var newOwnerBalance = web3.eth.getBalance(ownerAddress);
      var newContractBalance = web3.eth.getBalance(instance.address);

      assert(newPlayerBalance.equals( playerBalanceBefore.plus(betAmount).minus(feeAmountPerPlayer) ), "player should get back bet less fees" );
      assert(newOwnerBalance.equals( ownerBalanceBefore.plus(feeAmount) ), "owner should receive fee" );
      assert(newContractBalance.equals( contractBalanceBefore.minus( feeAmount).minus( roundInfo.winnablePot)), "contract balance should be set");
      done();
    }); //
  }); // should be possible to place & reveal bets (10 bets, no winner)

  after(function() {
    // runs after all tests in this block
    console.log("=========== GAS USAGE STATS ===========");
    console.log("transaction,  gas used");
    console.log(gasUseLog);
  });

}); // contract(NumberGame)
