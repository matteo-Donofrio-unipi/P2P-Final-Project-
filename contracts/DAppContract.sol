// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

contract DAppContract {

    uint public value;
    uint public valDue;
    event click();
    event clickDue(uint);

    constructor() {

        value = 42;
    }

    function pressClick() public {
        
        emit click();
    }

    function clickD(uint v) public {
        valDue = v;
        emit clickDue(valDue);
    }
}