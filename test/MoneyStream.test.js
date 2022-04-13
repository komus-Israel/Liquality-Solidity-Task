require("chai")
    .use(require("chai-as-promised"))
    .should()

const { ETHER_ADDRESS, tokens, ether } = require("./helper")

const PaymentContract = artifacts.require("./Payment")
const ERC20_USDT    = artifacts.require("./ERC20")
const ReEntrancy = artifacts.require("./ReEntrancy")
const  moment  = require("moment")



contract ("Payment Splitting and Simulated Money Streaming Unit Test", ([splitter, recipient1, recipient2, recipient3, recipient4])=>{

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


    describe("deposit, splitting and withdrawal", ()=>{

        let etherDeposit
        let usdtDeposit 


        /*
         * Approve the payment contract for the ERC20 deposit
         * Deposit ether to the payment contract
         * Deposit usdt to the payment contract
        */

        beforeEach(async()=>{

            await usdt.approve(paymentContract.address, tokens(30))
            etherDeposit = await paymentContract.depositEther({from:splitter, value: ether(20)})
            usdtDeposit = await paymentContract.depositToken(usdt.address, tokens(30))
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


            it("should not have zero deposits", async()=>{

                const contractDepositedTokenBalance = await paymentContract.getBalance(paymentContract.address, ETHER_ADDRESS)
                const contractDepositedEtherBalance = await paymentContract.getBalance(paymentContract.address, usdt.address)

                contractDepositedEtherBalance.toString().should.not.be.equal("0", "deposited ether balance of the contract is not zero")
                contractDepositedTokenBalance.toString().should.not.be.equal("0", "deposited token balance of the contract is not zero")

            })
            
        })


        describe("splitting", ()=>{ 


            /*
            * recipients array is represents the array of recipeients with their share allocation percentage   
            */
            
            let recipients 

            beforeEach(async()=>{

                reEntrancyAddress =  reEntrancy.address

                recipients = [

                    {_recipient: recipient1, _shareValue: 10, _streamDuration: 150},
                    {_recipient: recipient2, _shareValue: 10, _streamDuration: 150},
                    {_recipient: reEntrancyAddress, _shareValue: 10, _streamDuration: 150}
    
                ]
               
            })

            describe("ether splitting", ()=>{

                beforeEach(async()=>{

                    await paymentContract.splitToken(ETHER_ADDRESS, recipients, ether(20))
                })

                describe("sucessful splitting", async()=>{

                    it("increments the recipient's allocated balance from 0", async()=>{

                        const recipientBalanceInContract = await paymentContract.getBalance(recipient1, ETHER_ADDRESS)
                        recipientBalanceInContract.toString().should.not.be.equal("0", "recipient's allocated ether balance has been incremented from 0")
                        recipientBalanceInContract.toString().should.be.equal((ether(20) * 0.1).toString(), "recipient got 10% as his first allocated ether")
                   
                    })

                })

                describe("streamed withdrawal", ()=>{

                    beforeEach(async()=>{
                        await paymentContract.
                    })

                })
            })
        })

    })
   

})