const { FactomCli } = require('factom')

const cli = new FactomCli();

cli.walletdApi('transactions', {address: 'bb3b2811e05f202deff5fdb51cd2006bb9b10a2e22900ae503cd98c696e7c56a'})
    .then(tx => console.log(tx.transactions[1].inputs))
    .catch(err => console.log(err))

// const url = 'http://localhost:8089/v2'
// const body = {
//     jsonrpc: "2.0",
//     id: 0,
//     method: "transactions",
//     params: {
//         address: 'FA3mLULRCSkV5EbwTvB1M5h4Xj1PYXS1CbUicL7Q5ZMTfLhm8ma5'
//     }
// }
// axios.post(`${url}`, body)
//     .then(tx => console.log('Raw call:', tx.data.result.transactions))
//     .catch(err => console.log(err))
