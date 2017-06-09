var NumberGame = artifacts.require("./NumberGame.sol");

contract("NumberGame", function(accounts) {
  /* TODO: add  tests for
      - invalid bets tests: guess with 0, from same account, with invalid value (perhaps to separate .js)
      - getBet ( revealed and unreavealed phase)
      - getWinnablePot / getTotalPot
      - one reveal with real Oraclize callback
  */

  // { submittedGuess, encryptedBet, betWithSalt } T
  // TODO: create a factory function for load tests? use a number => { .. } mapping instead?
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

  var queryIds = new Array(); // to store queryIds sent (so that we don't need to wait for Oraclize callback)
  var oraclizeCbAddress;
  var gasUseLog = new Array();

  it('should be possible to deposit money to contract', function(done) {
    var amount = web3.toWei(5);
    var instance;
    NumberGame.deployed().then( function(contractInstance) {
      instance = contractInstance;
      return instance.sendTransaction({value: amount,
          address: contractInstance.address, from: accounts[0] });
    }).then(function(tx) {
      logGasUse("sendTransaction:", tx);
      assert.equal(tx.logs[0].event, 'e_fundsReceived');
      assert.equal(tx.logs[0].args._from, accounts[0]);
      assert.equal(tx.logs[0].args._amount. toNumber(), amount);
      assert.equal( web3.eth.getBalance(instance.address).toNumber(), amount, 'The new balance should be correct');
      // printBalance("2. contract balance after money put inside", contractInstance.address);
      done();
    });// deployed
  });  // should be possible to deposit money to contract


  it('should be possible to start a round', function(done) {
    var instance;
    var newLength = 86400; // we reveal manually in test
    var newFee = 10000; // 1%
    var newAmount = web3.toWei(1);
    var roundId, revealTime;
    NumberGame.deployed().then( function(contractInstance) {
      var instance=contractInstance;
      // Set round params
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
      ]).then( function() {
        return instance.startNewRound({from: accounts[1]});
      }).then( function(tx) {
        revealTime = Math.floor(Date.now() / 1000) + newLength;
        roundId = tx.logs[0].args._roundId;
        logGasUse("startNewRound", tx);
        assert.equal(tx.logs[0].event, 'e_roundStarted', "event should be emmitted");
        assert.equal(tx.logs[0].args._requiredBetAmount.toNumber(), newAmount, "nextRoundRequiredBetAmount should be set");
        assert.isAtLeast(tx.logs[0].args._revealTime.toNumber(), revealTime -1 ), "revealTime should be as expected";
        assert.isAtMost(tx.logs[0].args._revealTime.toNumber(), revealTime +1 ), "revealTime should be as expected";
        return instance.getRoundInfo(roundId);
      }).then( function(result) {
          var round = parseRoundInfo(result);
          assert(round.isActive, "new round should be active");
          assert.equal(round.requiredBetAmount, newAmount, "new round should have requiredBetAmount set");
          assert.isAtLeast(round.revealTime, revealTime -1 ), "revealTime should be as expected";
          assert.isAtMost(round.revealTime, revealTime +1 ), "revealTime should be as expected";
          assert.equal(round.roundLength, newLength, "new round should have roundLength set");
          assert.equal(round.betCount, 0, "new round betCount should be 0");
          assert.equal(round.revealedBetCount, 0, "new round revealedBetCount should be 0");
          assert.equal(round.unReveleadBetCount, 0, "new round unReveleadBetCount should be 0");
          assert.equal(round.invalidBetCount, 0, "new round invalidBetCount should be 0");
          assert.equal(round.winningAddress, 0, "new round winningAddress should be 0x0");
          assert.equal(round.smallestNumber, 0, "new round smallestNumber should be 0");
          assert.equal(round.winnablePot, 0, "new round winnablePot should be 0");
          assert.equal(round.fee, newFee, "new round fee should be set");
          done();
      }); // Promise.all

    }); // deployed
  }); // should be possible to start a round


  it('should be possible to place 1 bet (no winner)', function(done) {
    //it's dependent on the previous test with a new round
    var instance;
    var roundId = 0, playerAddress = accounts[1], betAmount = web3.toWei(1), queryId;
    NumberGame.deployed().then( function(contractInstance) {
      instance = contractInstance;
      instance.placeBet(roundId, testNumbers[1].encryptedBet, {from: playerAddress, value: betAmount})
      .then( function (tx) {
        logGasUse("placeBet 1st", tx);
        assert.equal(tx.logs[0].event, 'e_betPlaced', "event should be emmitted");
        assert.equal(tx.logs[0].args._roundId.toNumber(), roundId, "roundId should be set");
        assert.equal(tx.logs[0].args._from, playerAddress, "from should be the sender");
        queryIds.push( tx.logs[0].args._queryId);
        return instance.getRoundInfo(roundId);
      }).then( function (result) {
        var round = parseRoundInfo(result);
        assert.equal(round.betCount, 1, "new round betCount should be set");
        assert.equal(round.revealedBetCount, 0, "new round revealedBetCount should be 0");
        assert.equal(round.unReveleadBetCount, 1, "new round unReveleadBetCount should be set");
        assert.equal(round.invalidBetCount, 0, "new round invalidBetCount should be 0");
        assert.equal(round.winningAddress, 0, "new round winningAddress should be 0x0");
        assert.equal(round.smallestNumber, 0, "new round smallestNumber should be 0");
        assert.equal(round.winnablePot, (1-round.fee/1000000 )* betAmount, "new round winnablePot should be set");

        done();
      }); // placeBet
    }); // deployed
  }); // should be possible to place 1 bet (no winner)

  it('should be possible to reveal a bet (1 bet, winner)', function(done) {
    //it's dependent on the previous test with 1 bet placed
    var instance;
    var roundId = 0, playerAddress = accounts[1], betAmount = web3.toWei(1), queryId;
    var balanceBefore;
    NumberGame.deployed().then( function(contractInstance) {
      instance = contractInstance;
      return instance.getOraclizeCbAddress();
    }).then(function (res) {
      oraclizeCbAddress = res;
      balanceBefore = web3.eth.getBalance(playerAddress).toNumber();
      return instance.__callback(queryIds[0] , testNumbers[1].betWithSalt, {from: oraclizeCbAddress, gas: 4712100})
    }).then( function (tx) {
      logGasUse("Reveal bet 1 - last (1 bet, winner)", tx);

      assert.equal(tx.logs[0].event, 'e_betRevealed', "event should be emmitted");
      assert.equal(tx.logs[0].args._roundId.toNumber(), roundId, "roundId should be set");
      assert.equal(tx.logs[0].args._from, playerAddress, "_from should be player");
      assert.equal(tx.logs[0].args._queryId, queryIds[0], "queryId  should be set");
      assert.equal(tx.logs[0].args._betNumber.toNumber(), 1, "betnumber  should be 1");

      assert.equal(tx.logs[1].event, 'e_roundClosed', "event should be emmitted");
      assert.equal(tx.logs[1].args._roundId.toNumber(), roundId, "roundId should be set");
      assert.equal(tx.logs[1].args._winnerAddress, playerAddress, "winnerAddress should be player");
      assert.equal(tx.logs[1].args._winningNumber.toNumber(), 1, "winning number should be set");
      assert.equal(tx.logs[1].args._numberOfBets.toNumber(), 1, "numberofbets should be set");
      assert.equal(tx.logs[1].args._numberOfUnRevealedBets.toNumber(), 0, "unReveleadBetCouns should be 0");
      assert.equal(tx.logs[1].args._numberOfInvalidBets.toNumber(), roundId, "numberOfInvalidBets should be 0");

      return instance.getRoundInfo(roundId);
    }).then( function (result) {
        var round = parseRoundInfo(result);
        assert(!round.isActive, "the round shouldn't be active");
        assert.equal(round.revealedBetCount, 1, "new round revealedBetCount should be 1");
        assert.equal(round.unReveleadBetCount, 0, "new round unReveleadBetCount should be set");
        assert.equal(round.invalidBetCount, 0, "new round invalidBetCount should be 0");
        assert.equal(round.winningAddress, playerAddress, "new round winningAddress should be set");
        assert.equal(round.smallestNumber, 1, "new round smallestNumber should be 1");
        var newBalance = web3.eth.getBalance(playerAddress).toNumber();
        assert.equal(newBalance, round.winnablePot + balanceBefore, "pot should be sent to player ");

        //TODO: asserts
        done();
    }); // deployed
  }); // should be possible to reveal a bet (1 bet, winner)

  it('should be possible to reveal bets (4 bet, winner)', function(done) {
    var instance;
    var roundId, playerAddress = accounts[1], betAmount = web3.toWei(1), queryId;
    var balanceBefore;
    queryIds = [];
    var betsToPlace = [{n:2,p:1}, {n:8,p:2}, {n:5,p:3}, {n:2,p:4}];  // n: ref to testNumbers[], p: ref to  accounts[]
    var placeBetFn = function placeBet(bet) {
      return new Promise(resolve => resolve(
        instance.placeBet(roundId, testNumbers[bet.n].encryptedBet, {from: accounts[bet.p], value: betAmount})
        .then( function (tx) {
          queryIds.push( [tx.logs[0].args._queryId, bet]);
          logGasUse("placeBet (4 bet, winner) p:" + bet.p + " n: " + bet.n, tx);
          return tx;
        }) // placeBet
      )); // Promise
    } // placeBetFn

    var revealBetFn = function revealBet(query) {
      return new Promise(resolve => resolve(
        instance.__callback(query[0], testNumbers[query[1].n].betWithSalt, {from: oraclizeCbAddress})
        .then( function (tx) {
          queryIds.push( tx.logs[0].args._queryId);
          logGasUse("revealBet (4 bet, winner) p:" + query[1].p + "n: " + query[1].n, tx);
          return tx;
        }) // revealBet
      )); // Promise
    } // placeBetFn

    NumberGame.deployed().then( function(contractInstance) {
      instance = contractInstance;
      return instance.startNewRound({from: accounts[0]});
    }).then( function(tx) {
      logGasUse("2nd startRound (4 bet, winner)", tx);
      /*** PLACE BETS ***/
      roundId = tx.logs[0].args._roundId;
      var placeBetActions = betsToPlace.map(placeBetFn);
      var results = Promise.all( placeBetActions);
      results.then( function(tx) {
        return instance.getRoundInfo(roundId);
      }).then( function(result) {
        var round = parseRoundInfo(result);
        assert.equal(round.betCount, betsToPlace.length, "new round betCount should be set");
        assert.equal(round.revealedBetCount, 0, "new round revealedBetCount should be 0");
        assert.equal(round.unReveleadBetCount, betsToPlace.length, "new round unReveleadBetCount should be set");
        assert.equal(round.invalidBetCount, 0, "new round invalidBetCount should be 0");
        assert.equal(round.winningAddress, 0, "new round winningAddress should be 0x0");
        assert.equal(round.smallestNumber, 0, "new round smallestNumber should be 0");
        assert.equal(round.winnablePot, (1-round.fee/1000000 )* betAmount *betsToPlace.length, "new round winnablePot should be set");

        /*** REVEAL BETS ***/
        var revealBetActions = queryIds.map(revealBetFn);
        var results = Promise.all( revealBetActions);
        results.then( function(tx) {
          return instance.getRoundInfo(roundId);
        }).then( function(result) {
          var round = parseRoundInfo(result);
          assert.equal(round.betCount, betsToPlace.length, "round betCount should be set");
          assert.equal(round.revealedBetCount, betsToPlace.length, "round revealedBetCount should be set");
          assert.equal(round.unReveleadBetCount, 0, "round unReveleadBetCount should be set");
          assert.equal(round.invalidBetCount, 0, "round invalidBetCount should be 0");
          assert.equal(round.winningAddress, accounts[3], "round winningAddress should be set");
          assert.equal(round.smallestNumber, 5, "round smallestNumber should be 0");

          // TODO: check winner balance + owner balance
          done();
        });
      });
    }); // deployed
  }); // should be possible to reveal bets (4 bet, winner)

  after(function() {
    // runs after all tests in this block
    console.log("=========== GAS USAGE STATS ===========");
    console.log("transaction,  gas used");
    console.log(gasUseLog);
  });


  function parseRoundInfo(result) {
    return {
      isActive: result[0],
      requiredBetAmount: result[1].toNumber(),
      revealTime: result[2].toNumber(),
      roundLength: result[3].toNumber(),
      betCount: result[4].toNumber(),
      revealedBetCount: result[5].toNumber(),
      unReveleadBetCount: result[6].toNumber(),
      invalidBetCount: result[7].toNumber(),
      winningAddress: result[8],
      smallestNumber: result[9].toNumber(),
      winnablePot: result[10].toNumber(),
      fee: result[11].toNumber()
    }
  }

  function printBalance(_msg, _address) {
     console.log( _msg, web3.fromWei(web3.eth.getBalance(_address), 'ether').toNumber() );
  }; // printBalances

  function logGasUse(tran, tx) {
    gasUseLog.push(  tran + ', ' +  tx.receipt.gasUsed );
    //console.log("Gas used at", location, tx.receipt.gasUsed);
  }

}); // contract(NumberGame)
