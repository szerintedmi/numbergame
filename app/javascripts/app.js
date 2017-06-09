/*
 CHECK:  timezone for revealTimeString
 TODO:  web3 obj is going to be deprecated. Refactor to ethjs
        and use Promises every where (see: https://ethereum.stackexchange.com/a/16052/7866)
 TODO: test with metamask, mist etc. Handle errors if no web3, on wrong network etc.
 TODO: refactor into separate admin/common js ( use REACT?)
 TODO: add countdown for revealtime
 TODO: fix gameInfoUpdate multiple calls when events loaded at first call (especiall when from block 0)
 CHECK: is bet encryption secure enough? Eg. secureRandom fucntion? 10 bytes random length?
 CHECK:  do we always need numberGame.deployed() ?
 CHECK: revise error handling (where to catch,
        where else could we move form function (error,res) to .then  + .catch etc.)
*/

// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

import "bootstrap/dist/css/bootstrap.css";
var base64_arraybuffer = require('base64-arraybuffer/lib/base64-arraybuffer.js');
import { default as secureRandom} from "secure-random/lib/secure-random.js";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract';

// import './ensutils.js'; // TODO: add name resolution?

// Import our contract artifacts and turn them into usable abstractions.
import numberGame_artifact from '../../build/contracts/NumberGame.json'

//import abiDecoder from "abi-decoder";

// numberGame is our usable abstraction, which we'll use through the code below.
var numberGame = contract(numberGame_artifact);
var moment = require('moment');
var countdown = require('countdown');
require('moment-countdown');

//var ethEnsNamehash = require("eth-ens-namehash");

var accounts;
var accountSelected;
var accountSelectedIndex;

var currentRound = new Round(); // struct to store round info
var game = new Game();
var myBet = new Bet();


function Game ( _roundsCount, _latestRoundId,  _nextRoundLength,
     _nextRoundRequiredBetAmount,  _nextRoundFee ) {
    this.roundsCount = _roundsCount;
    this.latestRoundId = _latestRoundId;
    this.nextRoundLength = _nextRoundLength;
    this.nextRoundRequiredBetAmount = _nextRoundRequiredBetAmount;
    this.nextRoundFee = _nextRoundFee;
}

function Round (_roundId, _isActive,
 _requiredBetAmount,  _revealTime,  _roundLength,
 _betCount,  _revealedBetCount,   _unReveleadBetCount, _invalidBetCount,
 _winningAddress,  _smallestNumber, _winnablePot, _fee ) {
  /* to store round info from contract's getRoundInfo call :
  bool _isActive,
  uint _requiredBetAmount, uint _revealTime, uint _roundLength,
  uint _betCount, uint _revealedBetCount,  uint _unReveleadBetCount, uint _invalidBetCount,
  address _winningAddress, uint _smallestNumber,
  uint _winnablePot, uint _fee */

  this.roundId = _roundId;
  this.isActive = _isActive;
  this.requiredBetAmount = _requiredBetAmount;
  this.revealTime = _revealTime;
  this.roundLength = _roundLength;
  this.betCount = _betCount;
  this.revealedBetCount = _revealedBetCount;
  this.unReveleadBetCount = _unReveleadBetCount;
  this.invalidBetCount = _invalidBetCount;
  this.winningAddress = _winningAddress;
  this.smallestNumber = _smallestNumber;
  this.winnablePot = _winnablePot;
  this.fee = _fee;
} // Round

function Bet (roundId, playerAddress, _didBet, _betNumber, _didWin) {
  this.roundId = roundId;
  this.playerAddress = playerAddress;
  this.didBet = _didBet; /* if _didBet == true &&_betNumber = 0 then unrevealed  or revelead but invalid bet  */
  this._betNumber = _betNumber;
  this.didWin = _didWin;
}

window.App = {
  start: function() {
    var self = this;

    // Bootstrap the numberGame abstraction for Use.
    numberGame.setProvider(web3.currentProvider);

    numberGame.deployed().catch( function(err) {
      console.error("window.app.start() numberGame.deployed() error", err);
      App.setStatus("Error: can't find numberGame contract on network")
    });

    // Get the initial account balance so it can be displayed.
    App.retrieveAccounts().then( function(res) {
      accounts = res;
      App.selectAccount(0);

      App.listenToAccountChange();
      App.listenToEvents();
      console.debug("App.start - account: " + accountSelected);
    });

  },

  setStatus: function(message) {
    var status = document.getElementById("status");
    status.innerHTML = message;
  },

  retrieveAccounts: function() {
    return new Promise(function (resolve, reject) {
      web3.eth.getAccounts(function(err, accs) {
        if (err != null) {
          App.setStatus("Error while fetching your accounts. Are you running Chrome&Metamask or an Ethereum browser or geth/testrpc on localhost?");
          reject("Error while fetching your accounts", err);
        }

        if (accs.length == 0) {
          App.setStatus("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
          reject("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.")
          //throw new Error("");
        }
        resolve (accs);
      });
    }); //Promise
  }, // retrieveAccounts

  accountInfoUpdate: function() {
    console.debug("accountInfoUpdate initiated. SelectedAccountIndex: " + accountSelectedIndex);
    var numberOfAccounts = accounts.length;
    var accountsHTML = "";
    for (var i = 0; i < numberOfAccounts; i++) {
      accountsHTML += '<label class="radio">  \
      <input type="radio" name="accountRadio" onclick="App.selectAccount(' + i + ')" value="' + i + '"" id="accountsRadio'
      + i + '" ' + (i == accountSelectedIndex ? 'checked' : '') + '>' + accounts[i].toString() + '</label>'
    }
    if (i==0) { accountsHTML = "Can't retreive any account"}
    document.getElementById("accountList").innerHTML = accountsHTML;

    document.getElementById("accountAddress").innerHTML = accountSelected;
    web3.eth.getBalance(accountSelected, function(error, result) {
      if (error) {
        App.setStatus("Error updating account info");
        console.error("accountInfoUpdate() error", error);
      } else {
        document.getElementById("accountEther").innerHTML = web3.fromWei(result.toNumber());
      }
    }); // getBalance

  }, // accountInfoUpdate

  gameInfoUpdate: function() {
    console.debug("gameInfoUpdate initiated");

    numberGame.deployed().then(function(instance) {
      // console.debug("gameInfoUpdate numberGame.deployed");
      document.getElementById("contractAddress").innerHTML = instance.address;
      web3.eth.getBalance(instance.address, function(error, result) {
        if (error) {
          console.error("contract.getBalance() error", error);
        } else {
          document.getElementById("contractEther").innerHTML = web3.fromWei(result.toNumber(), "ether");
        };
      }); // getBalance instance.address

      instance.owner().then( function(res) {
        if (res == accountSelected ) {
          document.getElementById("areYouAdmin").innerHTML = "You are admin."
        } else {
          document.getElementById("areYouAdmin").innerHTML = "You are not admin but feel free to give a try (shouldn't work)."
        }
        document.getElementById("contractOwner").innerHTML = res;});

      /* instance.getOraclizePrice("decrypt").then( function(res) {
          document.getElementById("decryptPrice").innerHTML = web3.fromWei(res.toNumber(), "ether");
      }).catch( function (err) {console.error("getDecryptPrice error", err)}); */

      instance.getGameInfo().then( function(res) {
        // console.debug("instance.getGameInfo called",res);
        var placeBetFormDiv = document.getElementById("placeBetFormDiv");
        var myBetDiv = document.getElementById("myBetDiv");
        var startNewRoundDiv = document.getElementById("startNewRoundDiv");
        var roundInfoDiv = document.getElementById("roundInfoDiv");

        game.roundsCount = res[0].toNumber();
        if (game.roundsCount > 0) {
          game.latestRoundId = res[1].toNumber();
        } else {
          game.latestRoundId = null;
        }
        game.nextRoundLength = res[2].toNumber();
        game.nextRoundRequiredBetAmount = res[3].toNumber();
        game.nextRoundFee = res[4].toNumber();

        document.getElementById("latestRoundId").innerHTML = game.latestRoundId;
        document.getElementById("nextRoundLength").innerHTML = countdown(0, game.nextRoundLength*1000).toString(); //moment.unix(res).format("DD/MMM/YYYY HH:mm:ss")
        document.getElementById("nextRoundRequiredBetAmount").innerHTML = web3.fromWei(game.nextRoundRequiredBetAmount, "ether");
        document.getElementById("nextRoundFeePt").innerHTML = game.nextRoundFee / 10000;
        if ( game.roundsCount == 0 ) {
          // there is no round yet (ie. after first deploy)
          // no open round
          placeBetFormDiv.style.display = "none";
          myBetDiv.style.display =  "none";
          startNewRoundDiv.style.display = "inline";
          roundInfoDiv.style.display = "none";
          document.getElementById("roundStatus").innerHTML = "No rounds yet (first launch after contract deploy). Don't forget to <strong>send some Ether to contract </strong>before you start the first round!"
          return;
        }

        instance.getRoundInfo(game.latestRoundId).then( function(res){
          currentRound.roundId = game.latestRoundId;
          currentRound.isActive = res[0];
          currentRound.requiredBetAmount = res[1].toNumber();
          currentRound.revealTime = res[2].toNumber(),
          currentRound.roundLength = res[3].toNumber();
          currentRound.betCount = res[4].toNumber();
          currentRound.revealedBetCount = res[5].toNumber();
          currentRound.unReveleadBetCount = res[6].toNumber();
          currentRound.invalidBetCount = res[7].toNumber();
          currentRound.winningAddress = res[8];
          currentRound.smallestNumber = res[9].toNumber();
          currentRound.winnablePot = res[10].toNumber();
          currentRound.fee = res[11].toNumber();

          currentRound.revealTimeString = moment.unix(currentRound.revealTime).format("DD/MMM/YYYY HH:mm:ss")

          document.getElementById("debugRoundStatus").innerHTML = JSON.stringify(currentRound, null, 2);
          document.getElementById("roundActive").innerHTML = currentRound.isActive ?
            ( currentRound.revealedBetCount == 0 ? "Open round" : "Bets are being revelead" )
            : "Round closed";
          // CHECK: do we need this as well?
          document.getElementById("roundStatus").innerHTML =
            currentRound.isActive && currentRound.revealedBetCount == 0 ? "Active round" :
                (currentRound.revealedBetCount > 0 && currentRound.isActive) ?
                "Bets being revelead, you can start a new round once done" : "No open round. Start a new one";

          document.getElementById("betCount").innerHTML = currentRound.betCount;
          document.getElementById("revealedBetCount").innerHTML = currentRound.revealedBetCount;
          // TODO: make this work with countdown timer
          // document.getElementById("revealTimeCountDown").innerHTML = countdown( currentRound.revealTime *1000, null).toString();
          document.getElementById("revealTime").innerHTML = currentRound.revealTimeString;
          document.getElementById("betAmount").innerHTML = web3.fromWei(currentRound.requiredBetAmount, "ether");
          document.getElementById("winnablePot").innerHTML = web3.fromWei(currentRound.winnablePot, "ether");
          document.getElementById("feePt").innerHTML = currentRound.fee/ 10000;

          startNewRoundDiv.style.display =
            currentRound.isActive ? "none" : "inline";
          roundInfoDiv.style.display = "inline";

          instance.getBet(game.latestRoundId, accountSelected).then( function(res) {
            //console.debug("gameInfoUpdate getBet() res:", res);
            myBet.roundId = game.latestRoundId;
            myBet.playerAddress = accountSelected;
            myBet.didBet = res[0];
            myBet.betNumber = res[1].toNumber();
            myBet.didWin = res[2];

            var myGuess;
            if (myBet.didBet) {
              if( myBet.betNumber == 0) {
                if (currentRound.isActive) {
                  // I have a bet but it's not revealed yet
                  myGuess = "not revealed yet.";
                } else {
                  // Round closed
                  myGuess = "Your guess was invalid or round closed before reveal.";
                }
              } else {
                myGuess =  myBet.betNumber;
              }
            } else {
              myGuess = "Place a guess!";
            }
            document.getElementById("yourBet").innerHTML = myGuess;

            var myBetStatus = "";
            if (myBet.didWin) {
                if(currentRound.isActive ) {
                  myBetStatus = "Not all guesses revealed yet but your guess is the winner so far."
                } else {
                  myBetStatus =  "You won in this round!";
                }
            } else {
              if(currentRound.isActive) {
                myBetStatus == "Round is not closed yet."
              } else {
                if (currentRound.winningAddress == 0x0) {
                  myBetStatus = "No winner in this round - there wasn't any unique number guess placed. Bets have been refunded";
                } else {
                  myBetStatus = "Someone else won this round with a guess of " + currentRound.smallestNumber
                    + " from " + currentRound.winningAddress;
                }
              }
            }

            document.getElementById("yourBetStatus").innerHTML = myBetStatus;

            myBetDiv.style.display =
              myBet.didBet ? "inline" : "none";
            placeBetFormDiv.style.display =
              (currentRound.isActive && !myBet.didBet) ? "inline" : "none";
          }).catch( function(error) { console.error("getBet() error", error) }); // getBet();

        }).catch( function(error){ console.error("getRoundInfo() error", error); }); // getRoundInfo
      }).catch( function (err) {console.error("getGameInfo() error", err)}); // getGameInfo();
    }).catch(function(e) {
        console.error(e);
        App.setStatus("Can't connect to contract. Are you on the right Ethereum network?");
    }); //numberGame.deployed
  }, // App.gameInfoUpdate()

  // TODO: nicer way with promises but doesn't work web3 yet (need ethjs)
  // https://ethereum.stackexchange.com/questions/16051/can-i-use-metamask-with-promise-async-calls-instead-of-nested-callbacks/16052#16052
  //
  // basicInfoUpdate: function() {
  //   console.debug("basicInfoUpdate");
  //   numberGame.deployed().then(function(instance) {
  //
  //     document.getElementById("contractAddress").innerHTML = instance.address;
  //     document.getElementById("accountAddress").innerHTML = account;
  //     return web3.eth.getBalance(instance.address);
  //   }).then(function(contractBalance) {
  //     document.getElementById("contractEther").innerHTML = web3.fromWei(contractBalance).toNumber();
  //     return web3.eth.getBalance(account);
  //   }).then(function(accountBalance) {
  //     document.getElementById("accountEther").innerHTML = web3.fromWei(accountBalance).toNumber();
  //   }).catch(function(error){
  //     console.error(error);
  //     throw "Can't get balances"
  //   })
  // }, // basicInfoUpdate

  submitEtherToContract: function() {
    numberGame.deployed().then(function(instance) {
      console.debug("submitEtherToContract- sending transaction from account " + accountSelected + " to " + instance.address);
      return instance.sendTransaction({from: accountSelected, to:instance.address, value: web3.toWei(5, "ether")});
    }).then( function(result){
      console.debug("submitEtherToContract - transaction mined: ",result);
      // App.accountInfoUpdate(); // not necessary we update it from Event
    }).catch(function(e) {
      console.error("submitEtherToContract error", e);
    });
  }, // submitEtherToContract

  setNextRoundLength: function() {
    numberGame.deployed()
      .then(function(instance) {
        // TODO: add estimateGas and use it
        // var callData = instance.setNextRoundLength.getData;
        // var estimatedGas =  web3.eth.estimateGas( {from: accountSelected, to: instance.address, data: callData, value: web3.toWei(teamId, "ether")});
        var gasEstimate = 4712100;
        var nextRoundLength = parseInt(document.getElementById("nextRoundLengthInput").value);

        console.debug(" setNextRoundLength -  sending transaction nextRoundLength: " + nextRoundLength + " from account " + accountSelected + " to " + instance.address);
        instance.setNextRoundLength(nextRoundLength,
              {from: accountSelected, to: instance.address, gas: gasEstimate})
        .then( function(results) {
          // TODO: update UI
          console.debug("nextRoundLength - transaction mined: ",results);
        }).catch( function(error) {
          // CHECK: there is no error if non owner sends the transaction
          //        (onlyOwner doesn't throw just silently returns in order to not consume all gas)
          //         anyway to know about the error?
         console.error("nextRoundLength error:", error)
       }); // instance.setNextRoundLength

   }); // deployed
 }, // setNextRoundLength()

  setNextRoundRequiredBetAmount: function() {
    numberGame.deployed()
      .then(function(instance) {
        // TODO: add estimateGas and use it
        // var callData = instance.setNextRoundLength.getData;
        // var estimatedGas =  web3.eth.estimateGas( {from: accountSelected, to: instance.address, data: callData, value: web3.toWei(teamId, "ether")});
        var gasEstimate = 4712100;
        var nextRoundRequiredBetAmount =
          web3.toWei(parseFloat(document.getElementById("setNextRoundRequiredBetAmountInput").value), "ether");

        console.debug(" setNextRoundRequiredBetAmount -  sending transaction nextRoundRequiredBetAmount: " + nextRoundRequiredBetAmount + " from account " + accountSelected + " to " + instance.address);
        instance.setNextRoundRequiredBetAmount(nextRoundRequiredBetAmount,
              {from: accountSelected, to: instance.address, gas: gasEstimate})
        .then( function(txId) {
          console.debug("setNextRoundRequiredBetAmount - transaction mined: ",txId);
        }).catch( function(error) {
           // CHECK: there is no error if non owner sends the transaction
           //        (onlyOwner doesn't throw just silently returns in order to not consume all gas)
           //         anyway to know about the error?
          console.error("setNextRoundRequiredBetAmount error:", error);
        }); // instance.setNextRoundRequiredBetAmount

   }); // deployed
 }, // setNextRoundRequiredBetAmount()

 setNextRoundFee: function() {
   numberGame.deployed()
     .then(function(instance) {
       // TODO: add estimateGas and use it
       // var callData = instance.setNextRoundLength.getData;
       // var estimatedGas =  web3.eth.estimateGas( {from: accountSelected, to: instance.address, data: callData, value: web3.toWei(teamId, "ether")});
       var gasEstimate = 4712100;
       var nextRoundFee = parseFloat(document.getElementById("setNextRoundFeeInput").value) * 10000;

       console.debug(" setNextRoundFee -  sending transaction nextRoundFee: " + nextRoundFee + " from account " + accountSelected + " to " + instance.address);
       instance.setNextRoundFee(nextRoundFee,
             {from: accountSelected, to: instance.address, gas: gasEstimate})
       .then( function(txId) {
         console.debug("setNextRoundFee - transaction mined: ",txId);
       }).catch( function(error) {
          // CHECK: there is no error if non owner sends the transaction
          //        (onlyOwner doesn't throw just silently returns in order to not consume all gas)
          //         anyway to know about the error?
         console.error("setNextRoundFee error:", error);
       }); // instance.setNextRoundFee

  }); // deployed
}, // setNextRoundFee()

  placeBet: function() {

    numberGame.deployed()
      .then(function(instance) {

        // TODO: client side validation (is number, >0, max value etc.)
        instance.verifyBet(currentRound.roundId, currentRound.requiredBetAmount)
        .then( function (result) {

          if (result != 1) {
            // TODO: update UI (see result codes in contract code)
            alert("verifyBet error: " + result.toNumber());
            console.error("verifyBet error: ", result.toNumber());
            return false;
          }

          // TODO: add estimateGas and use it
          // var callData = instance.placeBet.getData;
          // var gasEstimate =  web3.eth.estimateGas( {from: accountSelected, to: instance.address,
          //                                   data: callData, value: currentRound.requiredBetAmount });
          var gasEstimate =  4712388;
          var submittedGuess = parseInt(document.getElementById("numberGuessInput").value);
          var betWithSalt = submittedGuess + ":" + base64_arraybuffer.encode( secureRandom(10, {type: 'Buffer'})) ;
          var betMessageToEncrypt = JSON.stringify({message: betWithSalt});

          var xhr = new XMLHttpRequest();
          var oraclizeURL = "https://api.oraclize.it/v1/utils/encryption/encrypt";
          xhr.open("POST", oraclizeURL, true);
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
              //console.debug("Response from Oraclize encrypt:", xhr.response); //Outputs a DOMString by default

              var encryptedBet = JSON.parse(xhr.response).result ;

              console.debug(" placeBet -  sending tx. roundId: " + currentRound.roundId + " | Value: "
                  + currentRound.requiredBetAmount + " from account " + accountSelected + " to "
                  + instance.address + " | gasEstimate: " + gasEstimate
                  + " | { submittedGuess: " + submittedGuess
                  + ", encryptedBet: '" +  encryptedBet + "'"
                  + ", betWithSalt: '" + betWithSalt + "' } ");
              instance.placeBet(currentRound.roundId, encryptedBet,
                    {from: accountSelected, to: instance.address, value: currentRound.requiredBetAmount, gas: gasEstimate})
              .then( function(result) {
                // TODO: update UI
                console.debug("PlaceBet - transaction mined: ",result);

              }).catch( function(error) {
               // TODO: update UI + check if it's triggered on error
               console.error("PlaceBet error:", error)
             }); // placeBet
           }
       } // xhr.onreadystatechange
       xhr.send(betMessageToEncrypt);

    }); // verifyBet
   }); // deployed
  }, // placeBet

  closeRound: function(forceClose) {
    /*  TODO: result code (updateResults success in all cases , even when error returned!)
    *           1 : no close was needed yet ( waiting for more bids to reveal )
    *           2 : all bet was revealed, round closed
    *           3 : there were unrevealed bids but forceClosed by owner
    *           4 : there was a revelead bid count cross check error but forceClosed by owner
    *
    *           -1 : close failed: function must be called by oraclize or owner
    *           -2 : closed failed: non owner tried to forceClose
    *           -3: close failed baceause of reveal counter crosscheck error */

    numberGame.deployed()
      .then(function(instance) {
        // TODO: add estimateGas and use it
        // var callData = instance.checkAndCloseRound.getData;
        // var estimatedGas =  web3.eth.estimateGas( {from: accountSelected, to: instance.address, data: callData, value: web3.toWei(teamId, "ether")});
        var gasEstimate = 4712100;

        console.debug(" checkAndCloseRound -  sending transaction with forceClose " + forceClose
            + " from account: " + accountSelected + " to: " + instance.address);
        instance.checkAndCloseRound(forceClose,
              {from: accountSelected, to: instance.address, gas: gasEstimate})
        .then( function(results) {
          // TODO: update UI
          console.debug("checkAndCloseRound - transaction mined: ", results);
        }).catch( function(error) {
         // TODO: update UI
         console.error("checkAndCloseRound error:", error)
       }); // instance.checkAndCloseRound

   }); // deployed
  }, // placeBet

  startNewRound: function() {
    /*  TODO: new round id? */

    numberGame.deployed()
      .then(function(instance) {
        // TODO: add estimateGas and use it
        // var callData = instance.checkAndCloseRound.getData;
        // var estimatedGas =  web3.eth.estimateGas( {from: accountSelected, to: instance.address, data: callData, value: web3.toWei(teamId, "ether")});
        var gasEstimate = 4712100;

        console.debug(" startNewRound -  sending transaction "
            + " from account: " + accountSelected + " to: " + instance.address);
        instance.startNewRound({from: accountSelected, to: instance.address, gas: gasEstimate})
        .then( function(results) {
          // TODO: update UI
          console.debug("startNewRound - transaction mined: ", results);
          App.gameInfoUpdate();
        }).catch( function(error) {
         // TODO: update UI
         console.error("startNewRound error:", error)
       }); // isntance.startNewRound

   }); // deployed
 }, // startNewRound

  listenToEvents: function() {
    console.debug("listenToEvents");

    numberGame.deployed().then(function(instance) {
      /* EVENTS from NumberGame contract:
       event e_betPlaced (uint indexed _roundId, address indexed _from, bytes32 _queryId);
       event e_betRevealed (uint indexed _roundId, address indexed _from, bytes32 _queryId, uint _betNumber);
       event e_roundClosed (uint indexed _roundId, address _winnerAddress, uint _winningNumber, uint _numberOfBets, uint _numberOfUnRevealedBets, uint _numberOfInvalidBets);
       event e_roundStarted (uint indexed _roundId, uint _requiredBetAmount, uint _revealTime);
       event e_error(string _errorMsg);
       event e_fundsReceived (address indexed _from, uint _amount);
       event e_settingChange(uint indexed _roundId, string _settingName, uint _oldValue, uint _newValue);
      */

      var fromBlock = "latest";  // 0 or "latest"

      instance.e_error({}, {fromBlock: fromBlock, toBlock: "latest"}).watch(function(error, result) {
        if(error) {
          console.error("listenToEvents() e_error watch error:", error);
        } else {
          //console.debug("Error event: ", result);
          document.getElementById("events").innerHTML =
            result.blockNumber + " | " + App.currentTime() + " Error: " + result.args._errorMsg + "</br>"
            + document.getElementById("events").innerHTML ;
        }; // if(error)
      }); // instance.e_error.watch

      instance.e_fundsReceived({}, {fromBlock: fromBlock, toBlock: "latest"}).watch(function(error, result) {
        if(error) {
          console.error("listenToEvents() e_fundsReceived watch error:", error);
        } else {
          //console.debug("e_fundsReceived: ", result);
          var from = result.args._from;
          var amount = web3.fromWei(result.args._amount, "ether");

          document.getElementById("events").innerHTML =
          result.blockNumber + " | " + App.currentTime() + " Contract received: "
          + amount + " ETH | From: " + from + "</br>"
          + document.getElementById("events").innerHTML;
          // CHECK: change these calls to async?
          App.accountInfoUpdate();
          App.gameInfoUpdate();
        }; // if(error)
      }); // e_fundsReceived

      instance.e_roundStarted({}, {fromBlock: fromBlock, toBlock: "latest"}).watch(function(error, result) {
        if(error) {
          console.error("listenToEvents() e_roundStarted watch error:", error);
        } else {
          //console.debug("e_roundStarted: ", result);
          currentRound.roundId = result.args._roundId;
          var currentRequiredBetAmount = web3.fromWei(result.args._requiredBetAmount, "ether");
          var revealTimeTimeStamp = result.args._revealTime;
          var revealTimeString = moment.unix(revealTimeTimeStamp).format("DD/MMM/YYYY HH:mm:ss");
          document.getElementById("events").innerHTML =
            result.blockNumber + " | " +App.currentTime() + " Round started. Id: " + currentRound.roundId + " | currentRequiredBetAmount: " + currentRequiredBetAmount +
            " | revealTime: " + revealTimeString + "</br>"
            + document.getElementById("events").innerHTML;
          App.gameInfoUpdate();
        }; // if(error)
      }); // e_roundStarted

      instance.e_betPlaced({}, {fromBlock: fromBlock, toBlock: "latest"}).watch(function(error, result) {
        if(error) {
          console.error("listenToEvents() e_betPlaced watch error:", error);
        } else {
          //console.debug("e_betPlaced: ", result);
          var roundId = result.args._roundId;
          var from = result.args._from;
          var queryId = result.args._queryId;
          document.getElementById("events").innerHTML =
            result.blockNumber + " | " + App.currentTime() + " Bet placed . roundId: " + roundId + " | from: " + from +
            " | queryId: " + queryId + "</br>"
            + document.getElementById("events").innerHTML;
          App.gameInfoUpdate();
        }; // if(error)
      }); // e_roundStarted

      instance.e_settingChange({}, {fromBlock: fromBlock, toBlock: "latest"}).watch(function(error, result) {
        if(error) {
          console.error("listenToEvents() e_settingChange watch error:", error);
        } else {
          //console.debug("e_settingChange: ", result);
          var roundId = result.args._roundId;
          var settingName = result.args._settingName;
          var oldValue = result.args._oldValue
          var newValue = result.args._newValue
          document.getElementById("events").innerHTML =
            result.blockNumber + " | " +App.currentTime() + " Setting Change: " + settingName + " | newValue: " + newValue +
            " | oldValue: " + oldValue + "</br>"
            + document.getElementById("events").innerHTML ;
          App.gameInfoUpdate();
        }; // if(error)
      }); // e_settingChange

      instance.e_betRevealed({}, {fromBlock: fromBlock, toBlock: "latest"}).watch(function(error, result) {
        if(error) {
          console.error("listenToEvents() e_betRevealed watch error:", error);
        } else {
          //console.debug("e_betRevealed: ", result);
          var roundId = result.args._roundId;
          var from = result.args._from;
          var betNumber = result.args._betNumber;
          var queryId = result.args._queryId;
          document.getElementById("events").innerHTML =
            result.blockNumber + " | " +App.currentTime() + " Bet revealed"
            + " round id: " + roundId + " | from: " + from
             + " | Guess number: " + betNumber +
            " | query id: " + queryId + "</br>"
            + document.getElementById("events").innerHTML ;
          App.gameInfoUpdate();
        }; // if(error)
      }); // e_betRevealed

      instance.e_roundClosed({}, {fromBlock: fromBlock, toBlock: "latest"}).watch(function(error, result) {
        if(error) {
          console.error("listenToEvents() e_roundClosed watch error:", error);
        } else {
          //console.debug("e_roundClosed: ", result);
          var roundId = result.args._roundId;
          var winnerAddress = result.args._winnerAddress;
          var winningNumber = result.args._winningNumber;
          var numberOfBets = result.args._numberOfBets;
          var numberOfUnRevealedBets = result.args._numberOfUnRevealedBets;
          var numberOfInvalidBets = result.args._numberOfInvalidBets;
          document.getElementById("events").innerHTML =
            result.blockNumber + " | " + App.currentTime() + " Round closed "
            + " round id: " + roundId
            + " | winner: " + winnerAddress
            + " | Winning number: " + winningNumber
            + " | Number of bets: " + numberOfBets
            + " | Unrevealed bets: " + numberOfUnRevealedBets
            + " | Invalid bets: " +  numberOfInvalidBets
            +  "</br>" + document.getElementById("events").innerHTML ;
          App.gameInfoUpdate();
          App.accountInfoUpdate();
        }; // if(error)
      }); // e_roundClosed

    }); // numberGame.deployed
  }, // listenToEvents

  selectAccount: function( accountIndex) {
    accountSelected = web3.eth.accounts[accountIndex];
    accountSelectedIndex = accountIndex;
    App.accountInfoUpdate();

    numberGame.deployed().then(function(instance) {
      numberGame.defaults({from: accountSelected, to: instance.address}); //, gas: 4712388, gasPrice: 100000000000
      App.gameInfoUpdate();
    }); // deployed
  }, // selectAccount

  listenToAccountChange: function() {
    // Check regurarly If account[0] has changed and update (handle Metamask)
    // https://github.com/MetaMask/faq/blob/master/DEVELOPERS.md
    // TODO: do we always need it or can we detect when METAMASK is used?
    var accountInterval = setInterval(function() {
      try {
        if (web3.eth.accounts[accountSelectedIndex] !== accountSelected) {
            accounts = web3.eth.accounts;
            App.selectAccount(0);
            console.debug("Accounts change detected.")
          }
      } catch (err) { console.error("can't connect" + err) };
    }, 500);
  }, // listenToAccountChange

  currentTime: function()  {
    return moment().format('HH:mm:ss');
  } // current time
}  // window.App

window.addEventListener('load', function() {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 balance, ensure you've configured that source properly. If using MetaMask, see the following link.  http://truffleframework.com/tutorials/truffle-and-metamask")
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider);
  } else {
    console.warn("No web3 detected. Falling back to http://localhost:8545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
  }

  App.start();
});
