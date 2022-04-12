pragma solidity 0.8.13;

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

    mapping(address => mapping(address => uint256)) private _shares;   


    /// @dev mapping the store the ether and erc20 token balances      

    mapping(address => mapping(address => uint256)) private _tokenBalances;

    /// @dev  declare the address of the splitter

    address private splitter;


    address private _contractAddress;
    address private _etherAddress;


    modifier onlySplitter() {

        require(msg.sender == splitter, "invalid sender");
        _;

    }


    constructor (address _splitter) {

        splitter = _splitter;
        _contractAddress = address(this);
        _etherAddress = address(0);

    }

    /// @param  _token is the address of the ERC20 token that will be deposited
    /// @param  _amount is the amount of tokens to be deposited by the splitter
    /// @notice IERC20 _tokenToDeposit = IERC20(_token). Creates an instance of the method of the token contract
    /// @notice _tokenToDeposit.transferFrom. This contract must have been approved for successful function call

    function depositToken(address _token, uint256 _amount) external onlySplitter {

        IERC20 _tokenToDeposit = IERC20(_token);
        _tokenToDeposit.transferFrom(msg.sender, address(this), _amount);
        _tokenBalances[_contractAddress[_token]] += _amount;

    }

    function depositEther() external payable onlySplitter {

        _tokenBalances[_contractAddress[_etherAddress]] += msg.value;
        
    }

}