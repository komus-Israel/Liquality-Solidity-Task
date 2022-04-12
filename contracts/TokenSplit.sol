pragma solidity 0.8.13;

/// @title  Token Split Contract

/*  @dev    This is a  smart contract that split ETHER and ERC 20 tokens to
    *       addresses based on their shares allocation

*/     


contract TokenSplit {

    /// @dev mapping to store shares allocated to addresses

    mapping(address => uint256) private _shares;         


    function depositToken(address _token) external {

    }

    function depositEther() external {

    }

}