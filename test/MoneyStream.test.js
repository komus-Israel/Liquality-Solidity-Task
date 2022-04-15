require("chai")
    .use(require("chai-as-promised"))
    .should()

const { ETHER_ADDRESS, tokens, ether, wait } = require("./helper")

const PaymentContract = artifacts.require("./Payment")
const ERC20_USDT    = artifacts.require("./ERC20")
const ReEntrancy = artifacts.require("./ReEntrancy")




contract ("Payment Splitting and Simulated Money Streaming Unit Test", ([splitter, recipient1, recipient2])=>{

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

                    {_recipient: reEntrancyAddress, _shareValue: 30, _streamDuration: 2592000},
                    {_recipient: recipient2, _shareValue: 70, _streamDuration: 2592000},
                    //{_recipient: reEntrancyAddress, _shareValue: 10, _streamDuration: 2592000}
    
                ]
               
            })

            describe("ether splitting", ()=>{

                beforeEach(async()=>{

                    await paymentContract.splitWithStream(ETHER_ADDRESS, recipients, ether(1))
                })

                describe("sucessful splitting", async()=>{

                    it("increments the recipient's allocated balance from 0", async()=>{

                        const recipientBalanceInContract = await paymentContract.getBalance(reEntrancyAddress, ETHER_ADDRESS)
                        recipientBalanceInContract.toString().should.not.be.equal("0", "recipient's allocated ether balance has been incremented from 0")
                        recipientBalanceInContract.toString().should.be.equal((ether(1) * 0.3).toString(), "recipient got 10% as his first allocated ether")
                   
                    })

                })

                describe("streamed ether withdrawal", ()=>{

            
                    it("withdraws ether in bits per seconds to the recipient's address", async()=>{

                        for (let sec = 0; sec < 10; sec ++) {
                            

                            /**
                             * The true recipient of this transaction is recipient2
                             * But I had to pay the gas fee using recipient1 so as not to tamper with the withdrawal balance update after paying gas fee
                             * This makes it easier to test that the withdrawal amount is in the correct proportion
                             * I simulated the transfer by causing `1 second` delay however it took `2 seconds` to complete withdrawal
                             * This means that I made withdrawal every `1 second` but it took `2 seconds` for the transaction to be processed
                             * The withdraw log is in the README.md
                             * My test values are from the PDF sent so it could be easy to see how well the code works
                             */
                            
                            await paymentContract.withdrawFromStream(1, {from: recipient1, gas: 5000000, gasPrice: 500000000})
                            const balance = await web3.eth.getBalance(recipient2)
                            console.log(balance.toString(), " =====> 270061728395 after every 1 second, 540123456790 after every 2 seconds")
                            await wait(1)           // create 1 sec delay for withdrawal
                            
                            
                        }


                        const checkStream = await paymentContract.checkStream(1)
                        const _streamBalance = checkStream._balance.toString()
                        const _amountIssued = checkStream._amountIssued.toString()
                        const _balanceFromContract = await paymentContract.getBalance(recipient2, ETHER_ADDRESS)

                        const reduced = Number(_streamBalance) < Number(_amountIssued)
                        reduced.should.be.equal(true, "the balance reduced after every withdrawal")
                        _balanceFromContract.toString().should.be.equal(_streamBalance, "the stream balance is equal to the total balance in contract")

                    
                    })

                   
                })

                describe("reEntrancy", ()=>{
                    
                    it("fails to implement re entrancy attack", async()=>{
                        await reEntrancy.attack().should.be.rejected
                    })

                })
               
            })

            describe("erc20 splitting", ()=>{

                let splitErc20

                beforeEach(async()=>{

                    splitErc20 = await paymentContract.splitWithStream(usdt.address, recipients, tokens(1))

                })


                describe("emitted event", ()=>{

                    it("emits the Splitted event", async()=>{
                        splitErc20.logs[0].event.should.be.equal("Splitted", "it emits the Splitted event")
                    })

                })

                describe("streamed erc20 withdrawal", ()=>{
                    
                    it("withdraws the erc20 token", async()=>{
                        for (let sec = 0; sec < 10; sec ++) {
                            

                            /**
                             * The true recipient of this transaction is recipient2
                             * But I had to pay the gas fee using recipient1 so as not to tamper with the withdrawal balance update after paying gas fee
                             * This makes it easier to test that the withdrawal amount is in the correct proportion
                             * I simulated the transfer by causing `1 second` delay however it took `2 seconds` to complete withdrawal
                             * This means that I made withdrawal every `1 second` but it took `2 seconds` for the transaction to be processed
                             * The withdraw log is in the README.md
                             * My test values are from the PDF sent so it could be easy to see how well the code works
                             */
                            
                            await paymentContract.withdrawFromStream(1, {from: recipient1, gas: 5000000, gasPrice: 500000000})
                            const balance = await usdt.balanceOf(recipient2)
                            console.log(balance.toString(), " =====> 270061728395 after every 1 second, 540123456790 after every 2 seconds")
                            await wait(1)           // create 1 sec delay for withdrawal
                            
                            
                        }
    
    
                        const checkStream = await paymentContract.checkStream(1)
                        const _streamBalance = checkStream._balance.toString()
                        const _amountIssued = checkStream._amountIssued.toString()
                        const _balanceFromContract = await paymentContract.getBalance(recipient2, usdt.address)
    
                        const reduced = Number(_streamBalance) < Number(_amountIssued)
                        reduced.should.be.equal(true, "the balance reduced after every withdrawal")
                        _balanceFromContract.toString().should.be.equal(_streamBalance, "the stream balance is equal to the total balance in contract")
                    })
                    

                })
            })
       })

    })

              
   

})