const StellarSdk = require('stellar-sdk')
const fetch = require('node-fetch')
const pair = process.argv.length < 3 ? StellarSdk.Keypair.random() :
  StellarSdk.Keypair.fromSecret(process.argv[2])
const addr = `https://friendbot.stellar.org?addr=${encodeURIComponent(pair.publicKey())}`

StellarSdk.Network.useTestNetwork()

if (process.argv.length < 3) {
  console.log(pair.secret())
  fetch(addr)
    .then(res => res.json())
    .then(json => console.log(json))
}
else {
  const server = new StellarSdk.Server("https://horizon-testnet.stellar.org")
  
  server.accounts().accountId(pair.publicKey()).call()
  .then(accountInfo => console.log(accountInfo))
  .catch(error => console.error(error))
}
