// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.0 <0.9.0;
import "./Collectibles.sol";
import "./newNFT.sol";
contract Lottery{

    Collectibles CL;
    newNFT newnft;
    address private CL_address; //address of the Collectibles deployed contract

    address private operator;
    address public balance_receiver;
    mapping(uint8=>string) private collectibles_bought; // id_collectible => collectible description
    uint8 private number_of_collectibles_bought;
    uint8 [6] private drawn_numbers; 
    mapping (uint8 => bool) private drawn_numbers_mapping; // drawn_number => true
    mapping (address => uint8) private reward_list; //address winner => class of the reward nft
    address[] private winners;
    

    uint8[] private NFT_minted; //take track of nft minted by this

    mapping (uint8 => bool) private free_NFT; // nft_class => bool saying if the NFT minted intially, with that class, is already assigned (value false) or not (value true)

    struct Ticket{ 
        address owner;
        uint8 [6] chosen_numbers;
    }

    Ticket[] private tickets_sold;

    uint64 private immutable price_tricket = 1000000000000000000;
    uint64 private block_number_init; //
    uint64 private immutable M = 5;

    bool private buy_phase=false;
    bool private extraction_phase=false; 
    bool private reward_phase=false; 
    bool private round_finished=true; //start initially as true, so a new round can start
    bool private prizes_computed=false;
    bool private prizes_given=false;
    bool public lottery_open=true; //set to true since it's used to distinghuish if the lottery has been closed or not.
    bool private balance_receiver_set = false;

    uint8 private immutable collectibles_number = 8;


    constructor () {
        //init the lottery operator
        operator = msg.sender;
        init_side_contracts();
    }

    //EVENTS

    event bal_initialized(address receiver);
    event start_new_round(bool buy_phase);
    event start_extraction_phase(bool extraction_phase);
    event start_reward_phase(bool reward_phase);

    event ticket_bought(uint8 [6] ticket_bought);
    event values_drawn(uint8[6] values_drawn);
    
    event prize_assigned(address winner, uint8[6] value_provided_user, uint8[6] draw_numbers, uint8 class_prize); 
    //address of the winner, values provided by the winner, drawn numbers, class of the prize

    event collectible_bought(uint8 id, string description);

    event NFT_minted_now (address owner,string description, uint8 NFT_class);

    event lottery_closed(bool lottery_closed);
    

    //MODIFIERS

    modifier onlyOperator { //verify that only the lottery operator can execute a function
        if (msg.sender == operator) _;
    }

    modifier buyPhaseActive { //verify that the buy phase is start, so now the users can buy tickets
        if(buy_phase==true) _;
    }

    modifier  extractionPhaseActive { //verify that the buy phase is closed, so now the operator can extract the random numbers
        if(extraction_phase == true ) _;
    }

    modifier rewardPhaseActive{ //verify that the random numbers are extracted, so now the operator can assign and compute the prizes
        if(reward_phase==true)
            _;
    }

    modifier roundIsFinished{ //verify that a round is finished, so now the oprator can start a new round
        if(round_finished==true)
            _;
    }

    modifier prizesAlreadyComputed{ //verify that the prizes are computed, so now the operator can give them to the winner users
        if(prizes_computed==true)
            _;
    }

    modifier lotteryOpen{ //verify that the lottery is open. Once the close_lottery() fun is invoked the value of lottery_open is set to false, so the function can't be invoked anymore.
        if(lottery_open==true)
            _;
    }

    modifier prizesNotGivenYet{ //verify that the prizes are not given yet to the winners. Once the give_prizes() fun is invoked, prizes_given is set to false, so the function can't be invoked anymore.
        if(prizes_given==false)
        _;
    }

    modifier balanceReceiverAlreadySet{ //verify that the account that takes the ether at end round is set. If it is not set, the function startNewRound() can't be invoked.
        if(balance_receiver_set==true)
        _;
    }

    //GETTER FUNCTIONS

    function get_lottery_state() view public returns (string memory){
        if(lottery_open)
            return ("Open");
        else
            return ("Closed");
    }

    //returns the block.number registered at the start round time
    function get_block_initRound() view public returns (uint){
        return block_number_init;
    }


    //receive the NFT_id and retrieve the NFT informations (owner, description, class) 
    function get_NFT_information(uint8 id) view public returns(address, string memory, uint8){
        require(id < NFT_minted.length, "Wrong ticket_id inserted");
        return newnft.get_NFT_informations(id);
    }

    //receive the ticket_id and retrieve the ticket informations (owner, submitted values)
    function get_ticket_information(uint8 id) view public returns(address, uint8 [6] memory){
        require(id < tickets_sold.length, "Wrong ticket_id inserted");
        return (tickets_sold[id].owner, tickets_sold[id].chosen_numbers);
    }

    function get_drawn_numbers() view public returns (uint8 [6] memory){
        return drawn_numbers;
    }

    function get_collectibles_information(uint8 id) view public returns (string memory){
        require(id <= number_of_collectibles_bought, "Wrong collectible_id inserted");
        return collectibles_bought[id];
    }

    function get_operator() view public returns (address){
        return operator;
    }

    function get_ticket_price() pure public returns (uint){
        return price_tricket;
    }

    //BUSINESS LOGIC FUNCTIONS

    function init_side_contracts() internal returns (bool res){
        newnft = new newNFT();

        CL = new Collectibles(); 
        CL_address = CL.get_address();
        res = true;
        return res;
    }



    function set_balance_receiver(address receiver) onlyOperator external returns (bool res){
        require(address(0x0)!= receiver, "Invalid address given");
        balance_receiver=receiver;
        balance_receiver_set=true;

        emit bal_initialized(receiver);

        res = true;
        return res;
    }

    //operator can close the lottery in any moment
    function close_lottery() onlyOperator lotteryOpen external returns (bool res){
        //first disable all the other function calls
        lottery_open=false; //no way to sei it false again => no way of getting reentrancy
        buy_phase = false;
        extraction_phase=false;
        reward_phase=false;
        round_finished=false;

        for(uint8 i=0;i<tickets_sold.length;i++)
            payable(tickets_sold[i].owner).transfer(price_tricket);    

        emit lottery_closed (true); 
        res = true;
        return res; 
    }


    //buy collectibles through the Collectibles object
    function buy_collectibles(uint8 id_collectible) onlyOperator payable external returns(bool res){
        require(id_collectible <= collectibles_number, "Too high Collectible_id inserted");
        collectibles_bought[id_collectible] = string(Collectibles(CL_address).buy_collectible{value:msg.value}(id_collectible));
        number_of_collectibles_bought++;

        emit collectible_bought(id_collectible,collectibles_bought[id_collectible] );

        res = true;
        return res;
    }

    //verify the correctness of the numbers provided by the users
    //invoked by buy_ticket()
    function check_given_numbers(uint8 [6] memory given_numbers) pure private returns (bool){

        for(uint8 i=0; i<5; i++){
            if(given_numbers[i] < 1 || given_numbers[i] > 69)
                return false;
        }
        if(given_numbers[5] < 1 || given_numbers[5] > 26)
            return false;
        
        return true;
    }

    //verify the correctness of the numbers provided by the users
    //invoked by buy_ticket()
    function check_duplicate(uint8 [6] memory input) private pure returns(bool){
        for(uint8 i=0; i<5;i++){
            for(uint8 j=i+1; j<5;j++){
                if(input[i]==input[j])
                    return false;
            }
        }
        return true;
    }



    function buy_ticket(uint8 [6] calldata  chosen_numbers) payable external returns (bool){

        uint64 money=uint64(msg.value);
        address owner = msg.sender;
        //checks for input data
        require(buy_phase,"Purchase phase concluded");
        require(msg.sender != balance_receiver, "The balance Receiver can't be a player");
        require(chosen_numbers.length == 6, "You have to choose 6 numbers");
        require(check_duplicate(chosen_numbers), "You can't insert duplicate values in the standard numbers");
        
        require(check_given_numbers(chosen_numbers), "Wrong values inserted");
        
        require(money>=price_tricket, "You have not enough ether");

        Ticket memory  ticket =  Ticket(owner, chosen_numbers);
        tickets_sold.push(ticket);

        if(money >= price_tricket) {
            uint64 change = uint64(money) - price_tricket;
            // send the change
            payable(owner).transfer(change);
        }

        emit ticket_bought(chosen_numbers);

        check_round_is_active();
        
        return true;
    }

    //after each ticket bought, verify if the number of blocks M is reached or not
    //invoked by buy_ticket()
    function check_round_is_active() private {
        if( (block.number - block_number_init)>= M){ //round concluded
            buy_phase=false;
            extraction_phase=true; 
            emit start_extraction_phase(true);
        }   
    }

    //extract the numbers randomly, done outside of the blockchain
    //invoked by draw_numbers() 
    function draw_numbers_compute() private view returns (uint8 [6] memory ){ //returns the extracted value

        uint8 [6] memory  numbers;
        uint seed =block.difficulty;
        uint8 extracted_value;
        bytes32 bhash;
        bytes32 rand;


        for(uint8 i=0;i<6;i++){
            
            bhash = (keccak256(abi.encodePacked(block.number,extracted_value,seed)));
            
            rand = keccak256(abi.encodePacked(bhash));

            if(i==5)
                extracted_value=uint8(uint(rand) % 27); 
            else
                extracted_value=uint8(uint(rand) % 70);                
            
            if(extracted_value==0) //since value range start from 1
                extracted_value++; 
            
            numbers[i]=extracted_value; 
        }
            
        bhash=0;
        rand=0;
            
        return (numbers);
    }


    function draw_numbers() onlyOperator extractionPhaseActive external returns(bool res) {

        uint8 [6] memory  computed_values; //mi permette di non accedere allo storage nel for
        computed_values = draw_numbers_compute();

        require(check_duplicate(computed_values), "Duplicate values in drawn numbers");

        emit values_drawn (computed_values);

        //aggiorno il mapping
        for(uint8 i =0; i<5;i++)
            drawn_numbers_mapping[computed_values[i]]=true;

        //scrivo su storage i valori estratti
        drawn_numbers = computed_values;

        //cancello variabile locale
        delete computed_values;

        extraction_phase=false;
        reward_phase=true;
        emit start_reward_phase(true);
        res = true;
        return res;
    }

    //compute, for each ticket bought, the number of matches obtained
    //invoked by compute_prizes()
    function compute_matches(uint8[6] memory num_picked_usr ) view private returns (uint8 , uint8 ){
        //input= array numeri scelti da utente
        uint8 normal_matches;
        uint8 powerball_match;
        for(uint8 i=0; i<5;i++){ //for each value submitted by user
            if(drawn_numbers_mapping[num_picked_usr[i]]==true)
                normal_matches++;
        }

        if(drawn_numbers[5]==num_picked_usr[5])
            powerball_match++;

        return (normal_matches, powerball_match);
    }

    
    //compare the drawn_numbers with the values provided by the users in the tickets and elect the winners 
    function compute_prizes() rewardPhaseActive onlyOperator external returns (bool res){

        uint8 powerball_match; //counter
        uint8 normal_matches; //counter
        uint8 class_value;
        uint8 i;

        uint8 [6] memory num_picked_usr;

        for( i=0; i<tickets_sold.length;i++){ //for each ticket
            num_picked_usr = tickets_sold[i].chosen_numbers; //take values submitted
            
            (normal_matches, powerball_match) = compute_matches(num_picked_usr);

            class_value=compute_class_value_prize(powerball_match, normal_matches);
            //modifica
            if(class_value>0){
                reward_list[tickets_sold[i].owner] = class_value;
                winners.push(tickets_sold[i].owner);
                emit prize_assigned(tickets_sold[i].owner, num_picked_usr, drawn_numbers, class_value);
            }
            
        }

        prizes_computed=true;
        res = true;
        return res;
    }

    //compute, for each ticket bought, the class of the NFT given as reward based on the number of matches
    function compute_class_value_prize(uint8 powerball_match, uint8 normal_matches) pure private returns (uint8){
        bool done=false;
        uint8 class_value=0;
        uint8 sum_values;
        //classes 1,2,7,8 handled handmade
        if(powerball_match==1){
            if(normal_matches==0){
                class_value=8;
                done=true;
            }
            if(normal_matches==5){
                class_value=1;
                done=true;
            }
        }

        if(powerball_match==0){
            if(normal_matches==1){
                class_value=7;
                done=true;
            }
            if(normal_matches==5){
                class_value=2;
                done=true;
            }
        }

        //classes 3,4,5,6 computed algorithmically
        if(!done){
            sum_values = powerball_match+normal_matches;
            if(sum_values>0)
                class_value= 8 - sum_values;
            else
                class_value=0;
        }

        return class_value;
    }

    //assign the NFTs to the winners: if a NFT is avaible it just transfer it to the winner, else it mints a new NFT  
    function give_prizes() onlyOperator rewardPhaseActive prizesAlreadyComputed prizesNotGivenYet external returns (bool res){
        uint8 i;
        uint8 NFT_class;
        for(i=0;i<winners.length;i++){
            NFT_class = reward_list[winners[i]]; // take the class of the nft to give as reward
            if(free_NFT[NFT_class]==true){ //if among the first 2 nfts minted there's the one with that class free, transfer it to the winner
                newnft.give_to_winner(winners[i],NFT_class-1); //class-1 perche i primi 8 nft, memorizzati in indici [0,7] corrispondo alle 8 classi
                free_NFT[NFT_class]=false; //set it to false
            }
            else
                newnft.mintToken(winners[i], collectibles_bought[NFT_class], NFT_class);
        }
        prizes_given=true;
        round_finished=true; //allow start_New_Round() to be invoked
        res = true;
        return res;
    }


    function mint(uint8 NFT_class, address owner) private returns (bool) {

        uint8 tokenId = newnft.mintToken(owner, collectibles_bought[NFT_class], NFT_class);

        NFT_minted.push(tokenId);

        emit NFT_minted_now (owner, collectibles_bought[NFT_class], NFT_class);

        return true;
    }





    function start_New_Round() onlyOperator roundIsFinished balanceReceiverAlreadySet external returns (bool res) { //non deve avere modifier rewardPhase perche viene invocato anche nel construttore 
        
        uint8 i;
        if(reward_phase){ //IF A LOTTERY'S ENDING => CLEAN ALL DATA STRUCTURE AND RESTART

            delete tickets_sold;

            for( i=0; i<5;i++)
                delete drawn_numbers_mapping[drawn_numbers[i]];
            
            delete drawn_numbers;

            for(i=0; i<winners.length;i++)
                delete reward_list[winners[i]];
            
            delete winners;

            payable(balance_receiver).transfer(address(this).balance);
            
        }
        else{
            uint8 tokenId = newnft.mintToken(operator, collectibles_bought[1], 1); //initially just mints 1 NFT1 with class == 1
            NFT_minted.push(tokenId);
            free_NFT[1]=true;
        }
        
            
        block_number_init = uint64(block.number); //SET THE NEW INITIAL BLOCK NUMBER
        prizes_computed=false;
        prizes_given=false;
        reward_phase=false;
        buy_phase=true;
        round_finished=false;
        emit start_new_round(true);
        res = true;
        return res;
    }




}