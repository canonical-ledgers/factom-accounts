const fs = require('fs')

const axios = require('axios')
const csv = require('csvtojson')
const yargs = require('yargs')

const argv = yargs
    .options({
        address: {
            demand: true,
            alias: 'a',
            describe: 'The address you would like to monitor',
            string: true
        },
        currency: {
            demand: true,
            alias: 'c',
            describe: 'The currency you are accounting in, given as three letter code (e.g. USD, GBP, EUR)',
            string: true
        },
        btcex: {
            demand: false,
            alias: 'b',
            describe: 'The exchange you wish to use to get the price of FCT in BTC. Defaults to Cryptocompare Current Aggregate',
            string: true
        },
        fiatex: {
            demand: false,
            alias: 'f',
            describe: 'The exchange you wish to use to get the price of BTC in your chosen currency. Defaults to Cryptocompare Current Aggregate',
            string: true
        },
        host: {
            demand: false,
            alias: 'H',
            describe: 'Define the IP and port of your walletd host using a url format (e.g. http://localhost:8089/v2). If left blank, defaults to port 8089 on localhost',
            string: true
        },
        path: {
            demand: false,
            alias: 'p',
            describe: 'Path to output CSV to an additional location (note: account.js will always save the master copy of the CSV to the local folder)'
        },
        key: {
            demand: false,
            alias: 'k',
            describe: 'Your bitcoin.tax key'
        },
        secret: {
            demand: false,
            alias: 's',
            describe: 'Your bitcoin.tax secret'
        },
        type: {
            demand: false,
            alias: 't',
            describe: 'You bitcoin.tax transaction type. Defaults to `income`. See the bitcoin.tax API docs for details'
        }

    })
    .help()
    .alias('help', 'h')
    .argv;

console.log('Started...')

const checkForNewTx = async(previouslyRecordedTransactions) => {
    try {
        const addressTransactionData = await apiCallWithRetry('addressData')
        const txObjPath = addressTransactionData.data.result.transactions
        const receivedArr = []

        for (let i = 0; i < txObjPath.length; i++) {
            if (txObjPath[i].outputs[0].address === argv.address
            && receivedArr.every((el) => el.txid !== txObjPath[i].txid)
            && previouslyRecordedTransactions.every((el) => el.txid !== txObjPath[i].txid)) {
                const apiMinOrHourData = Date.now() - txObjPath[i].timestamp * 1000 > 600000000 ? 'hour' : 'minute'
                const fiatPrice = await apiCallWithRetry(apiMinOrHourData, txObjPath[i].timestamp)
                const date = new Date(txObjPath[i].timestamp * 1000).toISOString()
                receivedArr.push({
                    date,
                    address: argv.address,
                    txid: txObjPath[i].txid,
                    fctReceived: txObjPath[i].outputs[0].amount * Math.pow(10, -8),
                    txType: txObjPath[i].inputs[0].amount !== 0 ? 'General' : 'Coinbase',
                    btcExchange: argv.btcex === undefined ? 'CryptoCompare Aggregate' : argv.btcex,
                    fiatExchange: argv.fiatex === undefined ? 'CryptoCompare Aggregate' : argv.fiatex,
                    fiatPrice,
                    fiatValue: txObjPath[i].outputs[0].amount * Math.pow(10, -8) * fiatPrice,
                    currency: argv.currency.toUpperCase()
                })
            }
        }

        receivedArr.reverse()
        receivedArr[0] === undefined ? 'do nothing' : console.log(`Found new transaction(s): ${JSON.stringify(receivedArr)}`)

        for (let i = 0; i < receivedArr.length; i++) {
            const csvData = `${receivedArr[i].date.slice(0, 10)}, ${argv.address}, ${receivedArr[i].txid}, \
${receivedArr[i].fctReceived}, ${receivedArr[i].txType}, ${receivedArr[i].btcExchange}, ${receivedArr[i].fiatExchange}, \
${receivedArr[i].fiatPrice}, ${receivedArr[i].fiatValue}, ${receivedArr[i].currency}\n`
            fs.appendFileSync('transaction-history.csv', csvData)
            if (argv.path !== undefined) {
                fs.appendFileSync(`${argv.path}/transaction-history.csv`, csvData)
            }
        }

        if (argv.key !== undefined && receivedArr[0] !== undefined) {
            await postDataToBitcoinTax(receivedArr)
        }

    } catch(err) {
        console.error("The application quit due to an unexpected error")
        console.error("----")
        console.error(err)
    }
}

const postDataToBitcoinTax = async(receivedArr) => {
    try {
        const bitcoinTaxArr = []
        for (let i = 0; i < receivedArr.length; i++) {
            bitcoinTaxArr.push({
                date: receivedArr[i].date,
                action: argv.type === undefined ? 'Income' : argv.type,
                symbol: 'FCT',
                currency: `${argv.currency}`,
                volume: receivedArr[i].fctReceived,
                price: receivedArr[i].fiatPrice,
                txhash: receivedArr[i].txid,
                recipient: argv.address
            })
        }

        const options = {
            method: 'POST',
            url: 'https://api.bitcoin.tax/v1/transactions',
            data: bitcoinTaxArr,
            headers: {
                "User-Agent": 'axios/0.18.0',
                "X-APIKEY": `${argv.key}`,
                "X-APISECRET": `${argv.secret}`
            },
            json: true
        }
        await axios(options)
    } catch(err) {
        console.log(err)
    }
}


async function apiCallWithRetry(type, objParam) {
    function wait (timeout) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve()
            }, timeout)
        })
    }

    const MAX_RETRIES = 10
    for (let i = 0; i <= MAX_RETRIES; i++) {
        try {
            if (type === 'addressData') {
                const url = argv.host === undefined ? 'http://localhost:8089/v2' : argv.host
                const body = {
                    jsonrpc: "2.0",
                    id: 0,
                    method: "transactions",
                    params: {
                        address: argv.address
                    }
                }
                const tx = await axios.post(`${url}`, body)
                return tx
            } else if (type === 'hour' || 'minute') {
                const exchangeBtc = argv.btcex === undefined ? 'CCCAGG' : argv.btcex
                const exchangeFiat =  argv.fiatex === undefined ? 'CCCAGG' : argv.fiatex
                const histBtc = await axios.get(`https://min-api.cryptocompare.com/data/histo${type}?fsym=FCT&tsym=BTC&limit=0&aggregate=1&toTs=${objParam}&e=${exchangeBtc}`)
                const histFiat = await axios.get(`https://min-api.cryptocompare.com/data/histo${type}?fsym=BTC&tsym=${argv.currency}&limit=0&aggregate=1&toTs=${objParam}&e=${exchangeFiat}`)
                const avgBtcPrice = (histBtc.data.Data[1].high + histBtc.data.Data[1].low + histBtc.data.Data[1].open + histBtc.data.Data[1].close) / 4
                const avgFiatPrice = (histFiat.data.Data[1].high + histFiat.data.Data[1].low + histFiat.data.Data[1].open + histFiat.data.Data[1].close) / 4
                const priceEstimate = avgFiatPrice * avgBtcPrice
                return priceEstimate
            }
        } catch (err) {
            const timeout = Math.pow(2, i)
            console.log('Waiting', timeout, 'ms')
            await wait(timeout)
            console.log('Retrying', err, i)
        }
    }
}

const checkForTransactions = setInterval(async () => {
    const currentFileState = []
    if (fs.existsSync('./transaction-history.csv')) {
        const csvFilePath = './transaction-history.csv'
        csv()
            .fromFile(csvFilePath)
            .on('json',(csvRow)=>{
                currentFileState.push(csvRow)
            })
            .on('done',(error)=>{
                checkForNewTx(currentFileState)
            })
    } else {
        console.log('Initialising new CSV')
        const csvInit = `date, address, txid, fctReceived, txType, btcExchange, fiatExchange, fiatPrice, fiatValue, currency\n`
        fs.writeFileSync("./transaction-history.csv", csvInit)
        if (argv.path !== undefined) {
            fs.writeFileSync(`${argv.path}/transaction-history.csv`, csvInit)
        }
        checkForNewTx(currentFileState)
    }
}, 60000)
