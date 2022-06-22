// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.0 <0.9.0;
import "./Collectibles.sol";
import "./newNFT.sol";
contract Lottery{

    Collectibles CL;
    newNFT newnft;
    address private CL_address; //address of the Collectibles deployed contract

    address public operator;
    address public balance_receiver;

    mapping(uint8=>string) private collectibles_bought; // id_collectible => collectible description
    uint8 [] private collectibles_bought_id;

    uint8 [6] public drawn_numbers; 
    mapping (uint8 => bool) private drawn_numbers_mapping; // drawn_number => true

    mapping (address => uint8) private reward_list; //address winner => class of the reward nft
    address[] private winners;
    
    uint8[] private NFT_minted; //take track of token id minted so far

    struct Ticket{ 
        address owner;
        uint8 [6] chosen_numbers;
    }
    Ticket[] private tickets_sold;

    uint64 public immutable price_tricket = 1000000000000000000;
    uint64 private block_number_init; //
    uint64 private immutable M = 5;

    uint8 private immutable collectibles_number = 8;

    string public lottery_state = "Open";
    string public lottery_phase_operator = "Not_started";

    bool private first_init_round = true; //used in order to detect the case in startNewRound

    uint8 public contatore =0;

    constructor () {
        //init the lottery operator
        operator = msg.sender;
        init_side_contracts();
    }

    //EVENTS

    event bal_initialized(address receiver);

    event phase_change(string phase_name);

    event ticket_bought(address owner, uint8 [6] return_chosen_numbers);
    event values_drawn(uint8[6] values_drawn);
    
    event prize_assigned(address winner, uint8[6] value_provided_user, uint8[6] draw_numbers, uint8 class_prize); 
    //address of the winner, values provided by the winner, drawn numbers, class of the prize

    event collectible_bought(uint8 id, string description);

    event NFT_minted_now (address owner,string description, uint8 NFT_class, uint8 id);

    event NFT_transfered (address owner, string description, uint8 NFT_class, uint8 id);

    event lottery_closed(bool lottery_closed);

    event print(address owner,string description, uint8 NFT_class, uint8 id);
    

    //MODIFIERS

    modifier onlyOperator { //verify that only the lottery operator can execute a function
        if (msg.sender == operator) _;
    }

    modifier initPhaseActive{
        if(keccak256(abi.encodePacked(lottery_phase_operator)) == keccak256(abi.encodePacked("Init_phase")))
        _;
    }

    modifier buyPhaseActive { //verify that the buy phase is start, so now the users can buy tickets
        if(keccak256(abi.encodePacked(lottery_phase_operator)) == keccak256(abi.encodePacked("Buy_phase")))
         _;
    }

    modifier  extractionPhaseActive { //verify that the buy phase is closed, so now the operator can extract the random numbers
        if(keccak256(abi.encodePacked(lottery_phase_operator)) == keccak256(abi.encodePacked("Extraction_phase")))
         _;
    }

    modifier givePrizesPhaseActive{ //verify that the random numbers are extracted, so now the operator can assign and compute the prizes
        if(keccak256(abi.encodePacked(lottery_phase_operator)) == keccak256(abi.encodePacked("Give_prizes_phase")))
        _;
    }

    modifier computePrizesPhaseActive{ //verify that the prizes are computed, so now the operator can give them to the winner users
        if(keccak256(abi.encodePacked(lottery_phase_operator)) == keccak256(abi.encodePacked("Compute_prizes_phase")))
            _;
    }

    modifier lotteryOpen{ //verify that the lottery is open. Once the close_lottery() fun is invoked the value of lottery_open is set to false, so the function can't be invoked anymore.
        if(keccak256(abi.encodePacked(lottery_state)) == keccak256(abi.encodePacked("Open")))
            _;
    }

    //GETTER FUNCTIONS

    function get_max_collectible_id() view public returns (uint8){
        return CL.collectibles_number();
    }

    //returns the block.number registered at the start round time
    function get_block_initRound() view public returns (uint){
        return block_number_init;
    }

    function get_num_tickets_sold() view public returns (uint8){
        return uint8(tickets_sold.length);
    }

    //receive the ticket_id and retrieve the ticket informations (owner, submitted values)
    function get_ticket_information(uint8 index) view public returns(address, uint8 [6] memory){
        require(index < tickets_sold.length, "Wrong ticket_id inserted");
        return (tickets_sold[index].owner, tickets_sold[index].chosen_numbers);
    }

    function get_contract_balance () view public returns (uint){
        return address(this).balance;
    }

    function get_num_collectibles_bought() view public returns (uint8){
        return uint8(collectibles_bought_id.length);
    }

    function get_collectible_info(uint8 index) view public returns (string memory){
        if(index < uint8(collectibles_bought_id.length))
            return string(collectibles_bought[collectibles_bought_id[index]]);
        else
            return ("No collectible bought so far");
    }

    function get_num_NFTs_minted() view public returns (uint8){
        return uint8(NFT_minted.length);
    }

        //receive the index in NFT_Minted, then retrieve the NFT informations (owner, description, class) 
    function get_NFT_information(uint8 index) view public returns(address, string memory, uint8, uint8){
        return newnft.get_NFT_informations(NFT_minted[index]);
    }  

    function get_last_ticket_bought() view public returns (address, uint8 [6] memory){
        //require (tickets_sold.length > 0, "No ticket bought so far");
        if(tickets_sold.length > 0){
            uint8 ticket_id = uint8(tickets_sold.length-1);
            return get_ticket_information(ticket_id);
        }
        else{
            uint8 [6] memory ret = [0,0,0,0,0,0];
            return (address(0x0), ret);
        }
    }

    function get_drawn_numbers() view public returns (uint8 [6] memory){
        return drawn_numbers;
    }

    /*
    function get_last_prize_assigned() view public returns (uint){
        return address(this).balance;
    }
    */

    //drawn numbers gestita da app.js

    //BUSINESS LOGIC FUNCTIONS

    function init_side_contracts() internal returns (bool res){
        newnft = new newNFT();

        CL = new Collectibles(); 
        CL_address = CL.get_address();
        res = true;
        return res;
    }

    function check_initPhase() internal returns (bool res){
        res=false;
        //emit print(collectibles_bought_id.length==8, balance_receiver!= address(0x0));
        if(collectibles_bought_id.length==8 && (balance_receiver!= address(0x0)) ){
            lottery_phase_operator="Init_phase";
            emit phase_change(lottery_phase_operator);
            res = true;
        }
        return res;    
    }



    function set_balance_receiver(address receiver) onlyOperator external returns (bool res){
        require(address(0x0)!= receiver, "Invalid address given");
        balance_receiver=receiver;

        emit bal_initialized(receiver);
        
        check_initPhase(); // verify if startNewRound can be invoked
        
        return res = true;
    }

        //buy collectibles through the Collectibles object
    function buy_collectibles(uint8 id_collectible) onlyOperator payable external returns(bool res){
        require(id_collectible <= collectibles_number, "Wrong Collectible_id inserted");
        require( id_collectible >0 , "Wrong Collectible_id inserted");
        collectibles_bought[id_collectible] = string(Collectibles(CL_address).buy_collectible{value:msg.value}(id_collectible));
        collectibles_bought_id.push(id_collectible);

        emit collectible_bought(id_collectible,collectibles_bought[id_collectible] );
        
        check_initPhase(); // verify if startNewRound can be invoked

        return res = true;
    }

    //operator can close the lottery in any moment
    function close_lottery() onlyOperator lotteryOpen external returns (bool res){
        //first disable all the other function calls
        lottery_state="Closed"; //no way to set it Open again => no way of getting reentrancy
        lottery_phase_operator = "Closed";
        emit phase_change(lottery_phase_operator);

        for(uint8 i=0;i<tickets_sold.length;i++)
            payable(tickets_sold[i].owner).transfer(price_tricket);    

        emit lottery_closed (true);
        
        return res = true; 
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



    function buy_ticket(uint8 [6] calldata  chosen_numbers) buyPhaseActive payable external returns (bool res){

        uint64 money=uint64(msg.value);
        address owner = msg.sender;
        //checks for input data
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

        uint8 [6] memory return_chosen_numbers = chosen_numbers; 

        emit ticket_bought(address(msg.sender), return_chosen_numbers);

        check_round_is_active();
        
        return res = true;
    }

    //after each ticket bought, verify if the number of blocks M is reached or not
    //invoked by buy_ticket()
    function check_round_is_active() private {
        if( (block.number - block_number_init)>= M){ //round concluded
            lottery_phase_operator = "Extraction_phase";
            emit phase_change(lottery_phase_operator);
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

        lottery_phase_operator = "Compute_prizes_phase";
        emit phase_change(lottery_phase_operator);

        return res = true;
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
    function compute_prizes() computePrizesPhaseActive onlyOperator external returns (bool res){

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
        lottery_phase_operator = "Give_prizes_phase";
        emit phase_change(lottery_phase_operator);
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
    function give_prizes() onlyOperator givePrizesPhaseActive external returns (bool res){
        lottery_phase_operator = "Init_phase"; // set here, ANTI REENTRANCY
        uint8 i;
        uint8 NFT_class;

        address address_temp;
        string memory description_temp;
        uint8 class_temp;
        uint8 token_id_temp;
        for(i=0;i<winners.length;i++){

            NFT_class = reward_list[winners[i]]; // take the class of the nft to give as reward

            // initially, 8 NFTs (one for each class) were minted with owner = operator, and their token_id are in the array NFT_Minted
            // so now check:
            // if the NFT minted initially with the class = class of the reward  is owned by the operator yet (this means that was not assigned as reward) => transfer this NFT to the winner user
            // if the NFT minted initially with the class = class of the reward is owned by a user (this means that was already assigned as reward) => mint another with the same class
            
            (address_temp, description_temp, class_temp, token_id_temp) = get_NFT_information(NFT_class-1); 
            // get_NFT_information takes the token_id of the NFT in input.
            // Since the first 8 NFT minted are one for each class and they're stored in NFT_Minted, an NFT of class 1 is stored in NFT_Minted[0] (because the index of the array NFT_Minted starts from 0, while the NFT class start from 1)
            // So generally for the first 8 NFT minted is true that a NFT of class x is stored in NFT_Minted[x-1].  
            
            if(address_temp == operator){ 
                newnft.give_to_winner(operator,winners[i],token_id_temp); //class-1 perche i primi 8 nft, memorizzati in indici [0,7] corrispondo alle 8 classi
                emit NFT_transfered (winners[i], collectibles_bought[NFT_class], NFT_class, token_id_temp);
            }
            else
                mint(NFT_class, winners[i], true);
        }

        emit phase_change(lottery_phase_operator);
        return res = true;
    }


    function mint(uint8 NFT_class, address owner, bool print) private returns (bool) {

        uint8 tokenId = newnft.mintToken(owner, collectibles_bought[NFT_class], NFT_class);

        NFT_minted.push(tokenId);

        if(print)
            emit NFT_minted_now (owner, collectibles_bought[NFT_class], NFT_class, tokenId);

        return true;
    }





    function start_New_Round() onlyOperator initPhaseActive  external returns (bool res) { //non deve avere modifier rewardPhase perche viene invocato anche nel construttore 
        
        uint8 i;
        if(first_init_round){ //IF A LOTTERY'S ENDING => CLEAN ALL DATA STRUCTURE AND RESTART

            //mint the first 8 NFTs, one for each class
            for(i =1; i< 9; i++)
                mint(i, operator, false); //(class, owner, bool that def if print or not the minting)
            
            first_init_round = false;
            
        }
        else{
            delete tickets_sold;

            for( i=0; i<5;i++)
                delete drawn_numbers_mapping[drawn_numbers[i]];
            
            delete drawn_numbers;

            for(i=0; i<winners.length;i++)
                delete reward_list[winners[i]];
            
            delete winners;

            payable(balance_receiver).transfer(address(this).balance);
        }
        
            
        block_number_init = uint64(block.number); //SET THE NEW INITIAL BLOCK NUMBER

        lottery_phase_operator="Buy_phase";
        emit phase_change(lottery_phase_operator);
        res = true;
        return res;
    }




}