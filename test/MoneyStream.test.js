require("chai")
    .use(require("chai-as-promised"))
    .should()

const { ETHER_ADDRESS, tokens, ether } = require("./helper")

const PaymentContract = artifacts.require("./Payment")
const ERC20_USDT    = artifacts.require("./ERC20")
const ReEntrancy = artifacts.require("./ReEntrancy")
const  moment  = require("moment")



contract ("Payment Splitting Unit Test", ([splitter, recipient1, recipient2, recipient3, recipient4])=>{

    let paymentContract;
    let usdt;
    let reEntrancy;
    let reEntrancyAddress


    beforeEach(async()=>{

        paymentContract = await PaymentContract.new()
        usdt = await ERC20_USDT.new("US Dollar Tether", "USDT")     //  represented the ERC20 token with USDT
        reEntrancy = await ReEntrancy.new(paymentContract.address)  // reEntrancy contract to be used to launch attack on the payment contract
        
    })


    describe("contract deployment", ()=>{

        it("should have a contract address", ()=>{
            paymentContract.address.should.not.be.equal("", "payment contract has an address")
            usdt.address.should.not.be.equal("", "erc20 contract for has an address")
        })

    })
   

})