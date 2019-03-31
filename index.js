const StellarSdk = require('stellar-sdk')
const fetch = require('node-fetch')
const pair = process.argv.length < 3 ? StellarSdk.Keypair.random()
  : StellarSdk.Keypair.fromSecret(process.argv[2])
const server = new StellarSdk.Server('https://horizon-testnet.stellar.org')

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
  const dstId = pair.publicKey()
  const payments = server.payments().forAccount(dstId)
  const lastToken = lastTokenLoad()

  lastToken && payments.cursor(lastToken)
  payments.stream({
    onmessage: payment => {
      lastTokenSave(payment.paging_token)
      if (payment.to !== dstId) return;

      const asset = payment.asset_type === 'native' ? 'lumens' :
        payment.asset_code + ':' + payment.asset_issuer

      console.log(payment.amount, asset, 'from', payment.from)
    },
    onerror: error => console.error(error)
  })
  process.on('SIGINT', () => logAccountInfo(dstId, () => process.exit(0)))
}

function lastTokenLoad () {

}

function lastTokenSave (token) {
  console.log('token', token)
}

function logAccountInfo (accountId, f = null) {
  server.accounts().accountId(accountId).call()
    .then(accountInfo => {
      console.log(accountInfo)
      f && f()
    })
    .catch(error => console.error(error))
}
