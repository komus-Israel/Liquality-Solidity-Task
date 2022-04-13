require("chai")
    .use(require("chai-as-promised"))
    .should()


const PaymentContract = artifacts.require("./Payment")
const ERC20_USDT    = artifacts.require("./ERC20")


contract ("Payment Splitting Unit Test", ()=>{

    let paymentContract;


    beforeEach(async()=>{
        paymentContract = await PaymentContract.new()
    })

})