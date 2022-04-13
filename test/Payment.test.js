require("chai")
    .use(require("chai-as-promised"))
    .should()

const { ETHER_ADDRESS, tokens, ether } = require("./helper")

const PaymentContract = artifacts.require("./Payment")
const ERC20_USDT    = artifacts.require("./ERC20")
const ReEntrancy = artifacts.require("./ReEntrancy")




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

                    {_recipient: recipient1, _shareValue: 10},
                    {_recipient: recipient2, _shareValue: 10},
                    {_recipient: reEntrancyAddress, _shareValue: 10}
    
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

                describe("failed reEntrancy attack after splitting", ()=>{

                    it("fails to execute reentrancy", async()=>{
                        await reEntrancy.attack().should.be.rejected
                    })

                    
                })

                describe("ether withdrawal", ()=>{

                    let withdrawal
                    let balanceBeforeWithdrawal
    
                    beforeEach(async()=>{
                        balanceBeforeWithdrawal = await web3.eth.getBalance(recipient1)
                        withdrawal = await paymentContract.withDraw(ether(0.2), ETHER_ADDRESS, {from: recipient1})
                    })
    
                    it("should emit the withdrawal event", async()=>{
                        withdrawal.logs[0].event.should.be.equal("Withdrawal", "it emitted the withdraw event")
                    })

                    it("should withdraw the ether into the recipient's address", async()=>{
                        const balanceAfterWithdrawal = await web3.eth.getBalance(recipient1)
                        const incremented = balanceAfterWithdrawal > balanceBeforeWithdrawal
                        incremented.should.be.equal(true, "ether balance of recipient was incremented after withdrawal")
                    })
    
                })

            })

            describe("erc20 token splitting", ()=>{

                beforeEach(async()=>{

                    await paymentContract.splitToken(usdt.address, recipients, tokens(20))

                })

                describe("successful splitting", ()=>{

                     it("increments the recipient's allocated balance from 0", async()=>{

                        const recipientBalanceInContract = await paymentContract.getBalance(recipient1, usdt.address)
                        recipientBalanceInContract.toString().should.not.be.equal("0", "recipient's allocated token balance has been incremented from 0")
                        recipientBalanceInContract.toString().should.be.equal((ether(20) * 0.1).toString(), "recipient got 10% as his first allocated token")
                   
                    })

                })

                describe("erc20 token withdrawal", ()=>{

                    let withdrawal
                    let balanceBeforeWithdrawal

                    beforeEach(async()=>{

                        balanceBeforeWithdrawal = await usdt.balanceOf(recipient1)
                        withdrawal = await paymentContract.withDraw(tokens(2), usdt.address)
                    })

                    it("emits the withdrawal event", ()=>{

                        withdrawal.logs[0].event.should.be.equal("Withdrawal", "it emitted the withdrawal event")
        
                    })

                    it("emits the address of the token withdrawn", ()=>{
                        withdrawal.logs[0].args.tokenAddress.should.be.equal(usdt.address, "it emits the address of the token withdrawn")
                    })

                    it("withdraws the token in the recipient's address", async()=>{
                        const balanceAfterWithdrawal = await usdt.balanceOf(recipient1)
                        const incremented = balanceAfterWithdrawal > balanceBeforeWithdrawal

                        incremented.should.be.equal(true, "the token balance of the recipient increased after withdrawal")
                    })
                })

            })

           
            
        }) 

    })
   
})