require("chai")
    .use(require("chai-as-promised"))
    .should()

const { ETHER_ADDRESS, tokens, ether } = require("./helper")

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

        let etherDeposit
        let usdtDeposit


        /*
         * Approve the payment contract for the ERC20 deposit
         * Deposit ether to the payment contract
         * Deposit usdt to the payment contract
        */

        beforeEach(async()=>{
            await usdt.approve(paymentContract.address, tokens(10))
            etherDeposit = await paymentContract.depositEther({from:splitter, value: ether(0.2)})
            usdtDeposit = await paymentContract.depositToken(usdt.address, tokens(10))
        })

        describe("successful deposits", ()=>{

            it("emits the deposit event", ()=>{

                etherDeposit.logs[0].event.should.be.equal("Deposit", "Deposit event was emitted for ether deposit")
                usdtDeposit.logs[0].event.should.be.equal("Deposit", "Deposit event was emitted for erc20 token deposit")
            })
        
            it("should not have 0 as the contract's ether and token balance", async()=>{
                const contractTokenBalance = await usdt.balanceOf(paymentContract.address)
                const contractEtherBalance = await web3.eth.getBalance(paymentContract.address)

                contractEtherBalance.toString().should.not.be.equal("0", "ether balance of the payment is not equal to zero")
                contractTokenBalance.toString().should.not.be.equal("0", "token balance of the payment is not equal to zero")

            })
            
        })

    })

})