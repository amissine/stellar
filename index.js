const StellarSdk = require('stellar-sdk')
const fetch = require('node-fetch')
const pair = process.argv.length < 3 ? StellarSdk.Keypair.random() :
  StellarSdk.Keypair.fromSecret(process.argv[2])
const server = new StellarSdk.Server("https://horizon-testnet.stellar.org")

StellarSdk.Network.useTestNetwork()

if (process.argv.length < 3) createNewAccount()
else workWithExistingAccounts()

function createNewAccount () {
  const addr = 
    `https://friendbot.stellar.org?addr=${encodeURIComponent(pair.publicKey())}`

  console.log(pair.secret())
  fetch(addr)
  .then(res => res.json())
  .then(json => console.log(json))
}

function workWithExistingAccounts () {
  if (process.argv.length > 3) sendMoney()
  else monitorPayments()
}

function sendMoney () {
  const srcId = pair.publicKey()
  const dstId = StellarSdk.Keypair.fromSecret(process.argv[3]).publicKey()
  var transaction

  server.loadAccount(dstId)
  .catch(StellarSdk.NotFoundError, error => console.error(error))
  .then(() => { return server.loadAccount(pair.publicKey()) })
  .then(sourceAccount => {
    transaction = new StellarSdk.TransactionBuilder(sourceAccount, { fee: 111 })
    .addOperation(StellarSdk.Operation.payment({
      destination: dstId,
      asset: StellarSdk.Asset.native(),
      amount: process.argv[4]
    }))
    .addMemo(StellarSdk.Memo.text('Test Transaction'))
    .setTimeout(180)
    .build()
    transaction.sign(pair)
    return server.submitTransaction(transaction)
  })
  .then(result => logAccountInfo(srcId))
  .catch(error => console.error(error))
}

function monitorPayments () {
  logAccountInfo(pair.publicKey())
}

function logAccountInfo (accountId) {
  server.accounts().accountId(accountId).call()
  .then(accountInfo => console.log(accountInfo))
  .catch(error => console.error(error))
}
