pragma solidity 0.8.13;

// SPDX-License-Identifier: MIT

/// @title  Token Split Contract

/*  
    *       @dev    This is a  smart contract that split ETHER and ERC 20 tokens to
    *       addresses based on their shares allocation
*/     


import "./utils/IERC20.sol";

contract TokenSplit {

    fallback () external payable {

    }

    /// @dev mapping to store token shares allocated to an address

    //mapping(address => mapping(address => uint256)) private _shares;   


    /// @dev mapping the store the ether and erc20 token balances      

    mapping(address => mapping(address => uint256)) private _tokenBalances;

    /// @dev  declare the address of the splitter

    address private splitter;

    /// @dev  declare the address of the contract

    address private _contractAddress;

    /// @dev  declare the address of ether

    address private _etherAddress;


    /// @dev ToeknRecipeint struct is used to track the recipient and the allocation of shares of the recipient during split

    struct TokenRecipient {

        address _recipient;
        uint256 _shareValue;

    }


    modifier onlySplitter() {

        require(msg.sender == splitter, "invalid sender");
        _;

    }


    constructor (address _splitter) {

        splitter = _splitter;
        _contractAddress = address(this);
        _etherAddress = address(0);

    }

    /// @param  _tokenAddress is the address of the ERC20 token that will be deposited
    /// @param  _amount is the amount of tokens to be deposited by the splitter
    /// @notice IERC20 _tokenToDeposit = IERC20(_token). Creates an instance of the method of the token contract
    /// @notice _tokenToDeposit.transferFrom. This contract must have been approved for successful function call

    function depositToken(address _tokenAddress, uint256 _amount) external onlySplitter {

        IERC20 _tokenToDeposit = IERC20(_tokenAddress);
        _tokenToDeposit.transferFrom(msg.sender, _contractAddress, _amount);
        _tokenBalances[_contractAddress][_tokenAddress] += _amount;

    }

    function depositEther() external payable onlySplitter {

        _tokenBalances[_contractAddress][_etherAddress] += msg.value;

    }

    function splitToken(address _tokenAddress, TokenRecipient[] calldata _recipients, uint256 _amount) external {
        
        require(_tokenBalances[_contractAddress][_tokenAddress] >= _amount, "insufficient amount to split");

        for (uint256 index = 0; index < _recipients.length; index++) {

            uint256 _amountToSplitToAddress = _recipients[index]._shareValue / 100;
            _tokenBalances[_recipients[index]._recipient][_tokenAddress] += _amountToSplitToAddress;
            _tokenBalances[_contractAddress][_tokenAddress] -= _amountToSplitToAddress;
            

        }

    }

    

}