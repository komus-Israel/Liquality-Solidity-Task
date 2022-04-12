pragma solidity 0.8.13;

//  SPDX-License-Identifier: UNLICENSED

/// @title  Token Split Contract

/*  
    *       @dev    This is a  smart contract that split ETHER and ERC 20 tokens to
    *       addresses based on their shares allocation
*/     


import "./utils/IERC20.sol";

contract Payment {



    fallback () external payable {

    }

      
    /// @dev mapping the store the ether and erc20 token balances      

    mapping(address => mapping(address => uint256)) private _tokenBalances;



    address private splitter;                           //  declare the address of the splitter
    address private _contractAddress;                   //  declare the address of the contract
    address private _etherAddress;                      //  declare the address of ether
    bool private _locked;                               //  declare the variable to be used in reentrancy modifier


    /// @dev TokenRecipeint struct is used to track the recipient and the allocation of shares of the recipient during split

    struct TokenRecipient {

        address _recipient;
        uint256 _shareValue;

    }


    modifier onlySplitter() {

        require(msg.sender == splitter, "invalid sender");
        _;

    }


    /// @notice locked = true
    /// @dev    when an attacker calls the withdraw or refund function, the function is set to locked. It will only be unlocked when the function runs to the end
    /// @dev    locked = false after the withdraw or refund function finishes executing

    modifier noReEntrancy() {

        require(!_locked, "no re-entrancy");
        _locked = true;
        _;
        _locked = false;
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


    /// @dev Function to deposit ether from the splitter

    function depositEther() external payable onlySplitter {

        _tokenBalances[_contractAddress][_etherAddress] += msg.value;

    }


    /// @dev    function to split tokens to recipient addresses based on the percentage of shares allocated to them
    /// @dev    The token isn't transferred to their wallets yet, but it is transferred to their token balance in the contract
    /// @param  _tokenAddress is the address of the token (ERC20 or ETHER) that will be splitted to the recipients' balances
    /// @param  _recipients is an array of Struct that contains the address and the share percentage of each recipients
    /// @param  _amount is amount of tokens from which every recipients will be issued tokens.This is the amount to be splitted among the recipients

    function splitToken(address _tokenAddress, TokenRecipient[] calldata _recipients, uint256 _amount) external {
        
        require(_tokenBalances[_contractAddress][_tokenAddress] >= _amount, "insufficient amount to split");

        for (uint256 index = 0; index < _recipients.length; index++) {

            uint256 _amountToSplitToAddress = _recipients[index]._shareValue / 100;
            _tokenBalances[_recipients[index]._recipient][_tokenAddress] += _amountToSplitToAddress;
            _tokenBalances[_contractAddress][_tokenAddress] -= _amountToSplitToAddress;
            

        }

    }


    /// @dev  Withdraw function to be called by recipients. Calling this function sends the token to their wallet address
    /// @notice that re entrancy attack is blocked
    /// @param _amount is that amount of tokens (ERC20 or ETHER) to be withdrawn by the recipient
    /// @param _tokenAddress is the address of the token (ERC20 or ETHER) where the token will be withdrawn from

    function withDraw(uint256 _amount, address _tokenAddress) external noReEntrancy{

        require(_tokenBalances[msg.sender][_tokenAddress] >= _amount, "insufficient balance");

        if (_tokenAddress == _etherAddress) {

            (bool sent, ) = payable(msg.sender).call{value: _amount}("");
            require(sent, "Failed to release Ether");
            _tokenBalances[msg.sender][_tokenAddress] -= _amount;

        }

        IERC20 _tokenToWithdrawFrom = IERC20(_tokenAddress);
        _tokenToWithdrawFrom.transfer(msg.sender, _amount);
        _tokenBalances[msg.sender][_tokenAddress] -= _amount;

    }

    

}