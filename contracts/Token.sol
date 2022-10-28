// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
import "hardhat/console.sol";

contract Token {

    string public name;
    string public symbol;
    uint256 public decimals = 18; //uint is basically unsigned integer which means its not negative
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf; //mapping function helps us to read and write value using balanceOf. Which is used to track balances! 

    event Transfer(address indexed from, address indexed to, uint256 value);

    constructor(string memory _name, string memory _symbol, uint _totalSupply) {

    name = _name;
    symbol = _symbol;
    totalSupply = _totalSupply * (10**decimals);
    balanceOf[msg.sender] = totalSupply;

    }

    function transfer(address _to, uint256 _value) public returns (bool success) {

    require(balanceOf[msg.sender] >= _value);
    require(_to != address(0));

    balanceOf[msg.sender] = balanceOf[msg.sender] - _value;
    balanceOf[_to] = balanceOf[_to] + _value; 
    emit Transfer(_to, msg.sender, _value);
    return true;

    }
}