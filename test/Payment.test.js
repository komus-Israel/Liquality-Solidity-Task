require("chai")
    .use(require("chai-as-promised"))
    .should()


const PaymentContract = artifacts.require("./Payment")
const ERC20_USDT    = artifacts.require("./ERC20")


contract ("Payment Splitting Unit Test", ([splitter, recipient1, recipient2, recipient3, recipient4])=>{

    let paymentContract;
    let usdt;


    beforeEach(async()=>{

        paymentContract = await PaymentContract.new()
        usdt = await ERC20_USDT.new("US Dollar Tether", "USDT")     //  represented the ERC20 token with USDT

    })


    /*
        * Test case for the contract addresses
    */

    describe("contract deployment", ()=>{

        it("should have a contract address", ()=>{
            paymentContract.address.should.not.be.equal("", "payment contract has an address")
            usdt.address.should.not.be.equal("", "erc20 contract for has an address")
        })

    })


    describe("deposit, splitting and withdrawal", ()=>{

        beforeEach(async()=>{

        })

    })

})