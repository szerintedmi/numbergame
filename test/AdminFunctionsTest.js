var NumberGame = artifacts.require("./NumberGame.sol");

/* TODO:  forceClose */

contract("NumberGame", function(accounts) {

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

  it('GameInfo should be empty at start', function(done) {
    NumberGame.deployed().then( function(contractInstance) {
      return contractInstance.getGameInfo({from: accounts[1]}
      ).then(function(result) {
          assert.equal(result.length, 5, "gameInfos should return 5 items")
          assert.equal(result[0], 0, "roundsCount should be 0" );
          assert.equal(result[1], 0,  "latestRoundId should be 0" );
          done();
        });
    }); // deployed
  });  // GameInfo should be empty at start

  it('only owner should be able to change nextRoundLength', function(done) {
    var oldLen, oldAmount, oldFee;
    var instance;
    NumberGame.deployed().then( function(contractInstance) {
        instance = contractInstance;
        return instance.getGameInfo();
      }).then( function(result) {
        oldLen= result[2].toNumber();
        oldAmount = result[3].toNumber();
        oldFee = result[4].toNumber();

        return instance.setNextRoundLength(1, {from: accounts[1]});
      }).then(function(tx) {
        logGasUse("setNextRoundLength (nonwner)", tx);
        return instance.setNextRoundRequiredBetAmount(9, {from: accounts[1]});
      }).then( function(tx) {
        logGasUse("setNextRoundRequiredBetAmount (nonwner)", tx);
        return instance.setNextRoundFee(9, {from: accounts[1]});
      }).then( function(tx){
        logGasUse("setNextRoundFee (nonwner)", tx);
        return instance.getGameInfo();
      }).then( function(result) {
        assert.equal(result[2].toNumber(), oldLen, "nextRoundLength should be the same");
        assert.equal(result[3].toNumber(), oldAmount, "nextRoundRequiredBetAmount should be the same");
        assert.equal(result[4].toNumber(), oldFee, "nextRoundFee should be the same");
        done();
    }); // deployed
  });  // only owner should be able to change nextRoundLength, nextRoundRequiredBetAmount, nextRoundFee

  it('owner should be able to set nextRoundLength, nextRoundRequiredBetAmount, nextRoundFee', function(done) {
    var instance;
    NumberGame.deployed().then( function(contractInstance) {
      instance = contractInstance;
      var newLength = 999, newFee = 50000, newAmount = web3.toWei(2);;

      Promise.all( [
          instance.setNextRoundLength(newLength, {from: accounts[0]}).then( function(tx) {
              logGasUse("setNextRoundLength (owner)", tx);
              assert.equal(tx.logs[0].event, 'e_settingChange');
              //assert.equal(tx.logs[0].args._roundId, "");
              assert.equal(tx.logs[0].args._settingName, "nextRoundLength");
              assert.equal(tx.logs[0].args._newValue.toNumber(), newLength);
          }),

          instance.setNextRoundFee(newFee, {from: accounts[0]}).then( function(tx) {
              logGasUse("setNextRoundFee (owner)", tx);
              assert.equal(tx.logs[0].event, 'e_settingChange');
              //assert.equal(tx.logs[0].args._roundId, "");
              assert.equal(tx.logs[0].args._settingName, "nextRoundFee");
              assert.equal(tx.logs[0].args._newValue.toNumber(), newFee);
          }),

          instance.setNextRoundRequiredBetAmount(newAmount, {from: accounts[0]}).then( function(tx) {
             logGasUse("setNextRoundRequiredBetAmount (owner)", tx);
             assert.equal(tx.logs[0].event, 'e_settingChange', "event should be emmitted");
             //assert.equal(tx.logs[0].args._roundId, "");
             assert.equal(tx.logs[0].args._settingName, "nextRoundRequiredBetAmount");
             assert.equal(tx.logs[0].args._newValue.toNumber(), newAmount);
          })
      ]).then( function() {
        return instance.getGameInfo();
      }).then( function(result) {
          assert.equal(result[2].toNumber(), newLength, "nextRoundLength should be set");
          assert.equal(result[3].toNumber(), newAmount, "nextRoundRequiredBetAmount should be set");
          assert.equal(result[4].toNumber(), newFee, "nextRoundFee should be set");
          done();
      });  // Promise.all
    }); // deployed
  });  // owner should be able to set nextRoundLength, nextRoundRequiredBetAmount, nextRoundFee

} ); // contract(NumberGame)

function printBalance(_msg, _address) {
   console.log( _msg, web3.fromWei(web3.eth.getBalance(_address), 'ether').toNumber() );
}; // printBalances

function logGasUse(place, tx) {
  console.log("Gas used at", place, tx.receipt.gasUsed);
}
