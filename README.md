## A test driven smart contract to split Ether and ERC20 tokens to list of recipients and simulated Money stream

* The true recipient of this transaction is recipient2
* But I had to pay the gas fee using recipient1 so as not to tamper with the withdrawal balance update after paying gas fee
* This makes it easier to test that the withdrawal amount is in the correct proportion
* I simulated the transfer by causing `1 second` delay.
* This means that I made withdrawal every `1 second` but it took `2 seconds` for the transaction to be processed
* The withdraw log is in the README.md
* My test values are from the PDF sent so it could be easy to see how well the code works