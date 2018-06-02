const assert = require('assert')

const { FactomCli } = require('factom')
const cli = new FactomCli()

// describe('Check the functions that report the value of receipts', () => {
//     it('should correctly get the amount of FCT received', async (done) => {
//         const tx = await cli.walletdApi('transactions', {address: 'FA32T9NBLQqdzfjRy4Ga5co39smTkGMDMhcTWMjH7n8xrZm5hsyo'})
//
//         console.log(tx.transactions[0])
//         const received = tx.transactions[0].outputs
//             .filter(output => output.address === argv.address)
//             .reduce((sum, current) => sum + current, 0)
//
//         assert(received === 0.5)
//         done()
//     })
// })

async function foo() {
    const tx = await cli.walletdApi('transactions', {address: 'FA32T9NBLQqdzfjRy4Ga5co39smTkGMDMhcTWMjH7n8xrZm5hsyo'})

    console.log(tx.transactions[0])
    const received = tx.transactions[0].outputs
        .filter(output => output.address === 'FA32T9NBLQqdzfjRy4Ga5co39smTkGMDMhcTWMjH7n8xrZm5hsyo')
        .map(output => output.amount * Math.pow(10, -8) * 15)
        .reduce((sum, current) => sum + current, 0)

    console.log(received)
}

foo()
