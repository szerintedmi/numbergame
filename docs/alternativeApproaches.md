# Alternative approaches to keep number guess until round ends
A collection of potential alternatives approaches to address the issues with the first pass approach.

## Seal/Reveal approach
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

## Reveal secret key to decrypt all bets
Closing could be made atomic. If the same secret key was used to encrypt all bets in the round, you could just reveal the secret key at the end.

The hash of the secret key should be published with the round, to prevent tampering later.

The encryption scheme could be made simple and cheap enough to decrypt within EVM:
Use a cryptographically secure PRNG with a true random seed.
To encrypt a bet, take the next random number in the sequence and XOR with the bet.

A simple PRNG would be sha3(seed + counter) – which I think would be strong enough for this purpose.

This scheme still relies on an external party for encryption and revealing the key at a later stage, so they would know the bets, but at least they cannot alter bets (closing can verify the hash of the secret key).
### Advantages
1. we don't have to pay the max gas amount for each reveal callback request to Oraclize
1. we don't need to pay Oraclize fee for each bet
1. we might be able to implement rounds with max players number limit

### Questions
* Could it be implemented with Oraclize existing services or it requires a custom external service?

## Secret splitting
To avoid the single point of failure at the participant, the secret could be split among several parties, each with a small fragment that gets published at a later time. See https://en.wikipedia.org/wiki/Secret_sharing
https://en.wikipedia.org/wiki/Shamir%27s_Secret_Sharing
https://en.wikipedia.org/wiki/Threshold_cryptosystem
