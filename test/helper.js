const ETHER_ADDRESS = '0x0000000000000000000000000000000000000000'

const tokens=(n)=>{
    return new web3.utils.BN(
        web3.utils.toWei(n.toString(), 'ether')
    )
    
}

const ether = (n) => tokens(n)

const wait=(seconds)=>{
    const milliseconds= seconds * 1000
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}





module.exports = { ETHER_ADDRESS, tokens, ether, wait}

