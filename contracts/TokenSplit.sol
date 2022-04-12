pragma solidity 0.8.13;

/// @title  Token Split Contract

/*  
    *       @dev    This is a  smart contract that split ETHER and ERC 20 tokens to
    *       addresses based on their shares allocation
*/     


import "./utils/IERC20.sol";

contract TokenSplit {

    /// @dev mapping to store token shares allocated to an address

    mapping(address => mapping(address => uint256)) private _shares;   


    /// @dev mapping the store the ether and erc20 token balances      

    mapping(address => mapping(address => uint256)) private _tokenBalances;

    /// @dev  declare the address of the splitter

    address private splitter;


    modifier onlySplitter() {

        require(msg.sender == splitter, "invalid sender");
        _;

    }


    constructor (address _splitter) {

        splitter = _splitter;

    }


    function depositToken(address _token) external onlySplitter {

    }

    function depositEther() external onlySplitter {

    }

}