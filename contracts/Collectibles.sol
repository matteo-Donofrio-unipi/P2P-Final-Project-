// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.0 <0.9.0;

contract Collectibles {


    uint public immutable collectible_prize=1000000000000000000;
    uint8 public immutable collectibles_number = 8;
    mapping(uint8 => string  ) public collectibles_list; 
    bool [9] public collectibles_sold;

    event collectible_sold(uint8);

    constructor(){

        collectibles_list[0]="Hello_Kitty_0";
        collectibles_list[1]="Hello_Kitty_1";
        collectibles_list[2]="Hello_Kitty_2";
        collectibles_list[3]="Hello_Kitty_3";
        collectibles_list[4]="Hello_Kitty_4";
        collectibles_list[5]="Hello_Kitty_5";
        collectibles_list[6]="Hello_Kitty_6";
        collectibles_list[7]="Hello_Kitty_7";
        collectibles_list[8]="Hello_Kitty_8";
    }

    function get_address() view public returns (address){
        return address(this);
    }

    function buy_collectible(uint8 collectible_id) external payable returns(string memory) {
        require(collectible_id <= collectibles_number, "Wrong Collectible_ID"); 
        require( msg.value >= collectible_prize, "Value too small");
        require(!collectibles_sold[collectible_id], "Collectible already sold");

        uint money = msg.value;
        uint change;

        if(money > collectible_prize) {
            change = money - collectible_prize;
            // Reimbourse the change
            payable(msg.sender).transfer(change);
        }

        emit collectible_sold(collectible_id);
        collectibles_sold[collectible_id] = true;
        return collectibles_list[collectible_id];
    }



}