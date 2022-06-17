// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

contract DAppContract {

    uint public value;
    uint public valDue;
    event click();
    event clickDue(uint);
    address public operator;

    constructor() {
        operator = msg.sender;
        value = 42;
    }

    event give_operator(address oper);

    function get_operator() external returns (address){
        emit give_operator(operator);
        return operator;
    }

    function pressClick() public {
        
        emit click();
    }

    function clickD(uint v) public {
        valDue = v;
        emit clickDue(valDue);
    }
}