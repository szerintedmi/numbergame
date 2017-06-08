var NumberGame = artifacts.require("./NumberGame.sol");

contract("NumberGame", function(accounts) {

  it('should be possible to start a round', function(done) {
    var instance;
    var newLength = 999;
    var newFee = 10000;
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
          assert(result[0], "new round should be active");
          assert.equal(result[1].toNumber(), newAmount, "new round should have nextRoundRequiredBetAmount set");
          assert.isAtLeast(result[2].toNumber(), revealTime -1 ), "revealTime should be as expected";
          assert.isAtMost(result[2].toNumber(), revealTime +1 ), "revealTime should be as expected";
          assert.equal(result[3].toNumber(), newLength, "new round should have roundLength set");
          assert.equal(result[4].toNumber(), 0, "new round betCount should be 0");
          assert.equal(result[5].toNumber(), 0, "new round revealedBetCount should be 0");
          assert.equal(result[6].toNumber(), 0, "new round unReveleadBetCount should be 0");
          assert.equal(result[7].toNumber(), 0, "new round invalidBetCount should be 0");
          assert.equal(result[8], 0, "new round winningAddress should be 0x0");
          assert.equal(result[9].toNumber(), 0, "new round smallestNumber should be 0");
          assert.equal(result[10].toNumber(), 0, "new round winnablePot should be 0");
          assert.equal(result[11].toNumber(), newFee, "new round fee should be set");
          done();
      }); // Promise.all

    }); // deployed
  }); // should be possible to start a round

} ); // contract(NumberGame)

function printBalance(_msg, _address) {
   console.log( _msg, web3.fromWei(web3.eth.getBalance(_address), 'ether').toNumber() );
}; // printBalances

function logGasUse(place, tx) {
  console.log("Gas used at", place, tx.receipt.gasUsed);
}
