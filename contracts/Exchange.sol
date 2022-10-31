// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
import "hardhat/console.sol";
import "./Token.sol";

contract Exchange {
    address public feeAccount;
    uint256 public feePercent;
    mapping(address => mapping(address => uint256)) public tokens;
    mapping(uint256 => _Order) public orders;
    uint256 public ordersCount;

    event Deposit(address token, address user, uint256 amount, uint256 balance);
    event Withdraw(address token, address user, uint256 amount, uint256 balance);

    event Order ( 
        uint256 id,
        address user, 
        address tokenGet,  
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        uint256 timestamp
    );

    struct _Order { //all of this get stored in the blockchain
        uint256 id; //unique identifier for the transaction
        address user; //user who made the order
        address tokenGet;   
        uint256 amountGet;
        address tokenGive;
        uint256 amountGive;
        uint256 timestamp;
    }
    constructor(address _feeAccount, uint256 _feePercent) {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }
    //Deposit Tokens
    function depositToken(address _token, uint256 _amount) public {
        //Transfer tokens to exchange
        require(Token(_token).transferFrom(msg.sender, address(this), _amount));
        //Update user balance
        tokens[_token][msg.sender] = tokens[_token][msg.sender] + _amount;
        //Emit an event
        emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }
    //Withdraw Token
    function withdrawToken(address _token, uint256 _amount) public {
        //Ensure user has enough token to Withdraw
        require(tokens[_token][msg.sender] >= _amount);
        //Transfer tokens to user
        Token(_token).transfer(msg.sender, _amount);
        //Update user balance 
        tokens[_token][msg.sender] = tokens[_token][msg.sender] - _amount;
        //Emit an Event
        emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    //Check Balance 
    function balanceOf(address _token, address _user) 
    public 
    view 
    returns (uint256) {
        return tokens[_token][_user];
    }
    //MAKE AND CANCEL ORDERS
     
     //Token give -> the token they want to spend
     //Token get -> the token they want to receive
     function makeOrder(address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive) public {

        require(balanceOf(_tokenGive, msg.sender) >= _amountGive);

        ordersCount = ordersCount + 1;

        _Order(ordersCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, block.timestamp);

        emit Order(ordersCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, block.timestamp);
     }
}

