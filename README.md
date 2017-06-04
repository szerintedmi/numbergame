# numbergame
Decentralised Smallest Number Game on Ethereum

Play a game where each player sends one positive integer in a game round, with a fixed 'bet' amount. The player who sends a unique and smallest number wins the pot. This means if two people happen to send the same number, then the third one gets all the bets regardless.
If there is no winner (ie. there is no unique number in the round ) then all players get back their bet.  
What number would you put if you were to play this game?

NOTE: It's a work in progress project: there are plenty of TODO and some open questions. Check it below and the comments in code.

Contribution, code review and suggestions are welcome!

## Game Mechanics
1. A round is initiated by the first player. And be closed in a future time (closing date).
1. Players submit their guess: a positive integer number for the round. A pre-defined guess amount is included to have a stake in the game.
1. At the closing date, the round stops accepting further bets and a winner is selected. The winner is defined as the one who picked the lowest number that nobody else has picked.
1. At game close the organizer takes a pre-defined fee.
   * If there’s a winner, the contract disburses all remaining funds to the winner.
   * If there’s no winner, the remaining funds are disbursed to the participants.

## First pass approach
Participants send their bet to a 3rd party ([oraclize.it](http://www.oraclize.it/)) which encrypts it with it’s own secret key. The encrypted version of the bet is sent in to the contract. At a given time  - which is specified at the beginning of the round - the 3rd party starts revealing the clear-text bets, one by one. After all bets are revealed, the round is closed.

![OverView diagram](docs/numberGame_OverViewDiagram.png)
See also: [Detailed Sequence Diagram](docs/numberGame_sequenceDiagram.png)

### Potential problems:
* 3rd party is able to read the bets
* 3rd party may be able to alter the bets
* 3rd party may fail to deliver some (or all) clear-text bets. In this case, the round is couldn't be closed. Though there is a function with closeRound with which can be called by the contract owner
* It may cost too much gas to close a large round. Should make it iterative.
* We can only end the rounds in a given future time. Having a target Player number might be better for multiple reasons (incentify players to invite other players and no strategic advantage to bet last minute because number of players is fixed )  
Potential solution could be a custom  service which can reveal bet at any time by the request of the contract.

## Alternative Seal/Reveal approach
Implement a seal/reveal mechanism similar to the ENS domain registrar. See:
https://github.com/ethereum/EIPs/issues/162
https://github.com/ethereum/ens/blob/master/contracts/HashRegistrarSimplified.sol

Participants submit a sealed bet (a hash of round, owner, bet, random salt), and are expected to reveal their own bets in a grace period after the closing date. This way, no 3rd party needs to be involved.

### Problems:
* Participant may choose to withhold their bets after some others reveal theirs
* Bad UX - too much hassle for a  game
  * players must save their private keys for each bet
  * user must return to reveal the bid  
* Single point of failure
* Challenging to do shorter game turns



## Dev environment
### Prerequisites
* [Ethereum CLI](https://www.ethereum.org/cli)
* [nodejs](https://nodejs.org/en/download/)
* [node version manager](https://github.com/tj/n) `npm install -g n`
  * install 6.9.1 for ethereum-bridge: `n 6.9.1`
  * install latest (tested with 8.0.0): `n latest`
* [testRPC](https://github.com/ethereumjs/testrpc): `npm install -g ethereumjs-testrpc`
* [Truffle](https://truffle.readthedocs.io/en/latest/getting_started/installation/): `npm install -g truffle`
* [Ethereum bridge](https://github.com/oraclize/ethereum-bridge)
* [Ethereum explorer](https://github.com/szerintedmi/explorer) if you want to browse local chain from UI

```
git clone https://github.com/szerintedmi/numbergame.git
cd numbergame
npm install --save bootstrap
npm install --save moment
npm install --save moment-countdown
```

### Compile & deploy
#### TestRPC
1. `testrpc -m "hello build tongue rack parade express shine salute glare rate spice stock" -a 10`  
_This exact mnemonic is required in order to ethereum bridge deploy the contract to the same address which is currently hardcoded in NumberGame.sol_  

1. `n use 6.9.1 bridge -H localhost:8545 -a 9 --dev`
1. `truffle migrate`

TODO: When contract .sol changed then both testrcp and ethereum-bridge need to be restarted. truffle migrate won't deploy the new version.

TODO: dockerize

#### Local chain
TODO: not tested yet

#### Test network
TODO: not tested yet

## Testing
TODO: write unit tests

## Licence
This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.
