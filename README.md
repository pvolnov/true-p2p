# True P2P

**Problem:** P2P crypto swaps require bank transfer confirmation. This leads to centralization, delays, and errors.

*example: swap DAI to USD on Bank of America*

**Solution:** Protocol for P2P swaps based on onchain wire transfer confirmation

## How it works
1. Bob creates a deal to sell DAI.
2. Alice accepts the deal and freezes Bob's DAI.
3. Alice sends USD via Zelle.
4. Alice creates onchain proof of her Zelle transfer.
5. Alice uses this confirmation to close the deal and take Bob's DAI.

## Onchain proof for Bank (Zelle) transfer

The confirmation works with Plaid and the LIT Protocol nodes.

1. Alice connects Plaid and creates an API key with access to transaction history from the bank.
2. Alice calls Programmable PKPs action on LIT Protocol with Plaid transactionId and API key ([demo.js](https://github.com/pvolnov/true-p2p/blob/main/lit-action/demo.js)).
3. Inside the `LitAction`, it executes the request on Plaid and verifies that the transaction actually exists in Alice's bank account. ([litActionPlaidCheck.js](https://github.com/pvolnov/true-p2p/blob/main/lit-action/litActionPlaidCheck.js))
4. The `LitAction` signs the transaction information using the decentralized `signEcdsa()`.
5. Alice adds the signed transaction to the "vault" smart contract ([plaid-transactions-storage.sol](https://github.com/pvolnov/true-p2p/blob/main/contracts/plaid-transactions-storage.sol)), and now everyone can verify that she actually made the transaction from her bank account.

![Cover.png](https://github.com/pvolnov/true-p2p/blob/main/res/Cover.png)

## Step-by-step-swap
1. Bob creates a deal to sell DAI on [p2p-market](https://github.com/pvolnov/true-p2p/blob/main/contracts/p2p-market.sol) (`createPaymentRequest(...)`)
2. Alice accepts the deal and freezes Bob's DAI (`confirmPayment(...)`)
3. Alice sends USD via Zelle.
4. Alice creates onchain proof of her Zelle transfer on [plaid-transactions-storage](https://github.com/pvolnov/true-p2p/blob/main/contracts/plaid-transactions-storage.sol) (`addTransaction(...)`)
5. Alice uses this confirmation to close the deal and take Bob's DAI on [p2p-market](https://github.com/pvolnov/true-p2p/blob/main/contracts/p2p-market.sol) (`reservePayment(...)`)

## Main components:

- [p2p-market.sol](https://github.com/pvolnov/true-p2p/blob/main/contracts/p2p-market.sol) - P2P Market smart contract
- [plaid-transactions-storage.sol](https://github.com/pvolnov/true-p2p/blob/main/contracts/plaid-transactions-storage.sol) - onchain wire transactions storage
- [litActionPlaidCheck.js](https://github.com/pvolnov/true-p2p/blob/main/lit-action/litActionPlaidCheck.js) - LIT Action to verify Plaid requests
- [bos](https://github.com/pvolnov/true-p2p/tree/main/bos) - Frontend

## Demo:

Url: [https://bos.gg/#/azbang.near/widget/peer2peer](https://bos.gg/#/azbang.near/widget/peer2peer)

## Source
- BOS Component: [https://bos.gg/#/azbang.near/widget/peer2peer](https://bos.gg/#/azbang.near/widget/peer2peer)
- LIT-Protocol action ipfsId: `QmVcetXaAnDcHmpX6cWxsGKGSoid4buVK2PkXQEDmgh6wQ`
- LIT-Protocol PKPs: [https://explorer.litprotocol.com/pkps/110216617645918104171481682055149393821345448971586480839222858944196209976493](https://explorer.litprotocol.com/pkps/110216617645918104171481682055149393821345448971586480839222858944196209976493)
- Goerli Plaid transactions endpoint: [https://goerli.etherscan.io/address/0xa52210eA78f678D10e0dD47DeC64ff6ACD3Fbe8B](https://goerli.etherscan.io/address/0x00e42dc2248f37a28d39f790d49230e2ddd37b99)
- Goerli P2P Market: [https://goerli.etherscan.io/address/0xa3724030aA74016d1AE1e1B54bD79608F0E5866F](https://goerli.etherscan.io/address/0xa3724030aA74016d1AE1e1B54bD79608F0E5866F)
