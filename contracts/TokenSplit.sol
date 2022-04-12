pragma solidity 0.8.13;

/// @title  Token Split Contract

/*  
    *       @dev    This is a  smart contract that split ETHER and ERC 20 tokens to
    *       addresses based on their shares allocation
*/     


import "./utils/IERC20.sol";

contract TokenSplit {

    /// @dev mapping to store shares allocated to addresses

    mapping(address => uint256) private _shares;   


    /// @dev mapping the store the ether and erc20 token balances      

    mapping(address => mapping(address => uint256)) private _tokenBalances;

    function depositToken(address _token) external {

    }

    function depositEther() external {

    }

}