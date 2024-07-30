const express = require('express');
const cors = require('cors');
const { Web3 } = require('web3');
const rateLimit = require('express-rate-limit');
const app = express();
const FaucetAddress = '0xB50bC4F2a213e0DEa9D7B44bCBb5acF921c8A1a1';
const PrivateKey = '9c8eb6b23de894cd1e01f8ef2718d6ea2f3d7dfa9393719c64194e04d800f22c'
app.use(cors());
app.use(express.json());

const web3 = new Web3('https://testnet-rpc.layeredge.io');

// Set up rate limiter: maximum of 2 requests per IP within a 24-hour period
const limiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    max: 2, // limit each IP to 2 requests per windowMs
    message: 'You have exceeded the 2 requests in 24 hrs limit!', 
    headers: true,
});

// Apply rate limiter to all requests
app.use(limiter);

app.get('/', (req, res) => {
    res.send('Hello World');
})

app.post('/', async (req, res) => {
    try {
        const { address } = req.body;
        
        // Check balance of FaucetAddress to ensure sufficient funds
        const balance = await web3.eth.getBalance(FaucetAddress);
         
        const gasLimit = 21000000; // Typical gas limit for a simple ETH transfer
        const gasPrice = web3.utils.toWei('20', 'gwei');
        const value = web3.utils.toWei('0.1', 'ether');
        const totalCost = BigInt(value) + BigInt(gasLimit) * BigInt(gasPrice);

        if (BigInt(balance) < totalCost) {
            return res.json({
                error: 'Insufficient funds in the faucet address.'
            });
        }

        const tx = {
            from: FaucetAddress,
            to: address,
            value: value,
            gas: gasLimit,
            gasPrice: gasPrice,
        };

        const signedTx = await web3.eth.accounts.signTransaction(tx, PrivateKey);
        const txReceipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        console.log(txReceipt);
        res.json({
            status: 'success',
        });
    } catch (error) {
        console.log(error);
        res.json({
            error: error.message
        });
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
})

module.exports = app;
