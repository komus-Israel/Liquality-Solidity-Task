pragma solidity 0.8.10;

//  SPDX-License-Identifier: UNLICENSED

/// @title  Token Split Contract

/*  
    *   @dev    This is a  smart contract that split ETHER and ERC 20 tokens to
    *           addresses based on their shares allocation
*/     


import "./utils/IERC20.sol";

contract Payment {



    fallback () external  {

    }

      
    /// @dev map addresses to their ether and erc20 token balances      

    mapping(address => mapping(address => uint256)) private _tokenBalances;

    /// @dev   map ids to Stream struct

    mapping(uint256 => Stream) internal _streams;



    address private splitter;                           //  declare the address of the splitter
    address private _contractAddress;                   //  declare the address of the contract
    address private _etherAddress;                      //  declare the address of ether
    bool private _locked;                               //  declare the variable to be used in reentrancy modifier
    uint256 public _streamId;                          //  ID to keep track of every allocated stream

    /// @dev TokenRecipient Struct is used to track the recipients and the percentage of shares allocated to the recipients

    struct TokenRecipient {

        address _recipient;
        uint256 _shareValue;
        uint256 _streamDuration;

    }


    /// @dev The Stream Struct stores the data of the every stream created

    struct Stream {

        uint256 _id;
        uint256 _duration;
        uint256 _startTime;
        uint256 _endTime;
        uint256 _amountIssued;
        uint256 _balance;
        uint256 _amountPerSeconds;
        address _recipient;
        address _tokenAddress;


    }


    modifier onlySplitter() {

        require(msg.sender == splitter, "invalid sender");
        _;

    }


    /// @notice locked = true
    /// @dev    when an attacker calls the withdraw  function, the function is set to locked. It will only be unlocked when the function runs to the end
    /// @dev    locked = false after the withdraw function finishes executing

    modifier noReEntrancy() {

        require(!_locked, "no re-entrancy");
        _locked = true;
        _;
        _locked = false;
    }


    constructor () {

        splitter = msg.sender;
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
        emit Deposit(msg.sender, _tokenAddress, _amount);

    }


    /// @dev Function to deposit ether from the splitter

    function depositEther() external payable onlySplitter {

        _tokenBalances[_contractAddress][_etherAddress] += msg.value;
        emit Deposit(msg.sender, _etherAddress, msg.value);
    }


    /// @param  _holder is the address of the an holder whose balance is to be checked
    /// @param  _tokenAddress is token address of the token balance to be checked
    /// @return the token balance of the holder

    function getBalance(address _holder, address _tokenAddress) external view returns (uint256) {
        return _tokenBalances[_holder][_tokenAddress];
    }


    
    /// @dev    function to split tokens to recipient addresses based on the percentage of shares allocated to them
    /// @dev    The token isn't transferred to their wallets directly, but it is transferred to their token balance in the contract
    /// @param  _tokenAddress is the address of the token (ERC20 or ETHER) that will be splitted to the recipients' balances
    /// @param  _recipients is an array of Struct that contains the address and the share percentage of each recipients
    /// @param  _amount is amount of tokens from which every recipients will be issued tokens.This is the amount to be splitted among the recipients

    function splitWithStream(address _tokenAddress, TokenRecipient[] memory _recipients, uint256 _amount) external {

        
        require(_tokenBalances[_contractAddress][_tokenAddress] >= _amount, "insufficient amount to split");

        for (uint256 index = 0; index < _recipients.length; index++) {

            _streamId += 1;  
            uint256 _amountToSplitToAddress = (_amount / 100 ) * _recipients[index]._shareValue;
            uint256 _amountToWithDrawPerSeconds = _amountToSplitToAddress / _recipients[index]._streamDuration;
            uint256 _startTime = block.timestamp;
            uint256 _deadline = block.timestamp + _recipients[index]._streamDuration;
            
            _tokenBalances[_recipients[index]._recipient][_tokenAddress] += _amountToSplitToAddress;
            _tokenBalances[_contractAddress][_tokenAddress] -= _amountToSplitToAddress;

            _streams[index] = Stream(_streamId, _recipients[index]._streamDuration, _startTime, _deadline, _amountToSplitToAddress, _amountToSplitToAddress, _amountToWithDrawPerSeconds, _recipients[index]._recipient, _tokenAddress);

            emit Splitted(_recipients[index]._recipient, _tokenAddress, _amountToSplitToAddress);

        }

    }




    /// @dev    Withdraw function to be called by recipients. Calling this function sends the tokens directly to their wallet address
    /// @notice re entrancy attack is blocked
    /// @param  _streamID is the ID of the stream to be fetched and to make withdrawal from
    /// @dev    The amount of tokens (ERC20 or ETHER) to be withdrawn is contained in the Stream Data
    /// @dev    The address of the token (ERC20 or ETHER) to be withdrawn is contained in the Stream Data
    /// @dev    The address of the recipient is contained in the Stream Data    
    /// @notice The amount of balance is updated after every withdrawal
    /// @notice The start time is updated after every withdrawal. The next withdrawal is calculated from the updated start time

    function withdrawFromStream(uint256 _streamID) external noReEntrancy {

        Stream memory _stream = _streams[_streamID];

        uint256 _amountToWithDraw;

        if(block.timestamp > _stream._endTime && _stream._balance > 0) {

            _amountToWithDraw = _stream._balance;

        } else {

            _amountToWithDraw = (block.timestamp - _stream._startTime) * _stream._amountPerSeconds;
        }
         
        require(_stream._balance >= _amountToWithDraw, "insufficient balance");
        
        if(_stream._tokenAddress == _etherAddress) {

            (bool sent, ) = payable(_stream._recipient).call{value: _amountToWithDraw}("");
            require(sent, "Failed to release Ether");
            _tokenBalances[_stream._recipient][_stream._tokenAddress] -=  _amountToWithDraw;
            _stream._balance = _stream._balance - _amountToWithDraw;
            _streams[_streamID]._balance = _stream._balance;

        }  else {

            IERC20 _tokenToWithdrawFrom = IERC20(_stream._tokenAddress);
            _tokenToWithdrawFrom.transfer(_stream._recipient, _amountToWithDraw);
            _stream._balance = _stream._balance - _amountToWithDraw;
            _streams[_streamID]._balance = _stream._balance;
           _tokenBalances[_stream._recipient][_stream._tokenAddress] -=  _amountToWithDraw;

        }

        _streams[_streamID]._startTime = block.timestamp;
        
        emit StreamedWithdrawal (_stream._recipient, _stream._tokenAddress, _amountToWithDraw);


    }


    /// @dev    function to fetch the Stream data assigned to a stream id
    /// @param  _streamID is the ID of the Stream to be fetched

    function checkStream(uint256 _streamID) external view returns (uint256 _duration, uint256 _startTime, uint256 _endTime, uint256 _amountIssued, uint256 _balance, uint256 _amountPerSeconds, address _recipient, address _tokenAddress) {

        Stream memory _stream = _streams[_streamID];
        return (_stream._duration, _stream._startTime, _stream._endTime, _stream._amountIssued, _stream._balance, _stream._amountPerSeconds, _stream._recipient, _stream._tokenAddress);
    
    }


    event Deposit (address indexed depositor, address indexed tokenAddress, uint256 amount);
    event StreamedWithdrawal (address indexed withdrawee, address indexed tokenAddress, uint256 withdrawnAmount);
    event Splitted  (address indexed to, address indexed tokenAddress, uint256 amount); 

    

}