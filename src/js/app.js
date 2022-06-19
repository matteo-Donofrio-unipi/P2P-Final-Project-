App = { // OGGETTO CON VARIABILI E METODI

    contracts: {},
    web3Provider: null,             // Web3 provider
    url: 'http://localhost:8545',   // Url for web3
    account: '0x0',
    account_balance: 0,
    operator: '0x0',                 // current ethereum account
    current_account_type : "operator",
    lottery_state : "Open",
    price : 1000000000000000000n,


    init: function() {

        return App.initWeb3();
    },

    /* 1 */
    initWeb3: function() {
        console.log("Entered")
        // console.log(web3);
        
        if(typeof web3 != 'undefined') {
//            App.web3Provider = web3.currentProvider;
//            web3 = new Web3(web3.currentProvider);
            App.web3Provider = window.ethereum; // !! new standard for modern eth browsers (2/11/18)
            web3 = new Web3(App.web3Provider);
            try {
                    ethereum.request({ method: 'eth_requestAccounts' }).then(async() => { //ex ethereum.enable
                        console.log("DApp connected to Metamask");
                    });
            }
            catch(error) {
                console.log(error);
            }
        } else {
            App.web3Provider = new Web3.providers.HttpProvider(App.url); // <==
            web3 = new Web3(App.web3Provider);
        }

        return App.initContract();
    },

    /* 2 */
    /* Upload the contract's abstractions */
    initContract: function() {
        console.log("Dentro initcontract");
        // Get current account
        web3.eth.getCoinbase(function(err, account) {
            if(err == null) {
                App.account = account.toLowerCase(); //set App.account 
            }
        });

        // Load content's abstractions
        $.getJSON("Lottery.json").done(function(c) {
            App.contracts["Contract"] = TruffleContract(c);
            App.contracts["Contract"].setProvider(App.web3Provider);

            return App.initOperator();
        });
    },

    /* 3 */
    /* Initialize the operator account & the state of the lottery & set the account type */
    initOperator: function(){
        console.log("Dentro initOperator");
        App.contracts["Contract"].deployed().then(async(instance) =>{

            //get the lottery operator
            let res = await instance.operator({from: App.account});  
            App.operator = res.toLowerCase();
        
            //set the account informations
            App.setAccountType();


            //get the contract balance 
            res = await instance.get_contract_balance({from: App.account});
            $("#lotteryBalance").html("Lottery balance: "+res);


            //get the balance receiver (if set, else ret the 0x0 address)
            res = await instance.balance_receiver({from: App.account});
            $("#balanceReceiverField").html("Balance Receiver: "+res);

            //get the last collectible bought 
            res = await instance.get_last_collectible_bought({from: App.account});
            $("#lastCollectibleBought").html("Last Collectible bought: "+res);

            //get the last NFT minted (if set)
            res = await instance.get_last_NFT_minted({from: App.account});
            console.log("NFTNFT"+res);
            $("#lastNFTMinted").html("Last NFT Minted: "+res);


            //get the lottery phase
            res = await instance.lottery_phase({from: App.account}); 
            $("#lotteryPhase").html("Lottery Phase: "+res);

            //get the last ticket bought (if set)
            try{
                res = await instance.get_last_ticket_bought({from: App.account});
            }
            catch{
                res = "No ticket bought so far";
            }
            $("#lastTicketBought").html("Last Ticket Bought: "+res);

            
            //get the lottery state
            res = await instance.get_lottery_state({from: App.account});
            $("#lotteryState").html("Lottery State: "+res);

            //get the drawn numbers
            try{
                res = await instance.drawn_numbers({from: App.account});
            }
            catch{
                res = "Will be drawn later";
            }
            $("#drawnNumbers").html("Drawn numbers: "+res);

        }); 
        return App.listenForEvents();
    },


    /* 4 */
    // set of function handler for each event emitted 
    listenForEvents: function() {
        console.log("Dentro listen");
        App.contracts["Contract"].deployed().then(async (instance) => {
        

            instance.bal_initialized().on('data', function (event) {
                $("#balanceReceiverField").html("Balance Receiver: "+event.args.receiver);
                console.log("eventoPReso"+event.args.receiver);
                // If event has parameters: event.returnValues.valueName
            });

            instance.collectible_bought().on('data', function (event) { //click is the name of the event
                $("#lastCollectibleBought").html("Collectible bought: "+event.args[1]);
                console.log(event);
                // If event has parameters: event.returnValues.valueName
            });

            instance.NFT_minted_now().on('data', function (event) { //click is the name of the event
                $("#lastNFTMinted").html("Last NFT Minted: "+event);
                console.log(event);
                // If event has parameters: event.returnValues.valueName
            });



            instance.start_new_round().on('data', function (event) {
                $("#lotteryPhase").html("Lottery Phase: Buy Phase");
                console.log(event);
                // If event has parameters: event.returnValues.valueName
            });

            instance.start_extraction_phase().on('data', function (event) {
                $("#lotteryPhase").html("Lottery Phase: Extraction Phase");
                console.log(event);
                // If event has parameters: event.returnValues.valueName
            });

            instance.start_reward_phase().on('data', function (event) {
                $("#lotteryPhase").html("Lottery Phase: Reward Phase");
                console.log(event);
                // If event has parameters: event.returnValues.valueName
            });




            instance.ticket_bought().on('data', function (event) { //click is the name of the event
                $("#lastTicketBought").html("Last Ticket Bought: "+event);
                console.log(event);
                // If event has parameters: event.returnValues.valueName
            });

            instance.prize_assigned().on('data', function (event) { //click is the name of the event
                $("#prizesAssigned").html("Prizes Assigned: "+event);
                console.log(event);
                // If event has parameters: event.returnValues.valueName
            });
            
            instance.lottery_closed().on('data', function (event) { //click is the name of the event
                App.lottery_state = "Closed";
                $("#lotteryState").html("Lottery State: Closed");
                $("#lotteryPhase").html("Lottery Phase: Closed");
                console.log(event);
                // If event has parameters: event.returnValues.valueName
            });

            instance.values_drawn().on('data', function (event) { //click is the name of the event
                $("#drawnNumbers").html("Drawn numbers: "+event);
                console.log(event);
                // If event has parameters: event.returnValues.valueName
            });
            
            
            


        


            /*
            // web3.eth.getBlockNumber(function (error, block) {
                // click is the Solidity event
                instance.click().on('data', function (event) {
                    $("#eventId").html("Event catched!");
                    console.log("Event catched");
                    console.log(event);
                    // If event has parameters: event.returnValues.valueName
                });
            */
            // });

        });

        /* detect the change in the metamask account */
        ethereum.on('accountsChanged', function (accounts) {
            console.log("Eth evetn");
            App.setAccountType(); 
        });
    },


    //TODO: gestire balance receiver
    /* 1 */
    setAccountType: async function(){

        //ottiene l'address dell'account collegato su MM
        let accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        App.account = accounts[0].toLowerCase();

        //declare the new attribute balance
        App.balance = await web3.utils.fromWei(await web3.eth.getBalance(accounts[0]))

        // verifica se è operator o no
        if(App.account == App.operator)
            App.current_account_type="operator";
        else
            App.current_account_type="user";

        console.log("setAccountType detect: " + App.account + " of type: " + App.current_account_type);

        // aggiorna i dati mostrati
        $("#accountId").html("Your address: " + App.account);
        $("#accountType").html("Account type: " + App.current_account_type);
        $("#accountBalance").html("Account balance: " + App.balance);
        change_mode(0);     
    },

    /* SET DI FUNZIONI CHE INVOCANO LE FUNZIONI DELLO SMART CONTRACT */


    setBalancerReceiver: function() {
        App.contracts["Contract"].deployed().then(async(instance) =>{
            let address_string = document.getElementById('balanceReceiver').value.toLowerCase(); // <input name="one"> element
            let address = web3.utils.toChecksumAddress(address_string);
            await instance.set_balance_receiver(address,{from: App.account});
        });
    },

    startNewRound: function() {
        App.contracts["Contract"].deployed().then(async(instance) =>{
            await instance.start_New_Round({from: App.account});
        });
    },

    drawNumbers: function() {
        App.contracts["Contract"].deployed().then(async(instance) =>{
            await instance.draw_numbers({from: App.account});
        });
    },

    computePrizes: function() {
        App.contracts["Contract"].deployed().then(async(instance) =>{
            await instance.compute_prizes({from: App.account});
        });
    },

    givePrizes: function() {
        App.contracts["Contract"].deployed().then(async(instance) =>{
            await instance.give_prizes({from: App.account});
        });
    },

    closeLottery: function() {
        App.contracts["Contract"].deployed().then(async(instance) =>{
            await instance.close_lottery({from: App.account});
        });
    },

    buyCollectible: function() {
        App.contracts["Contract"].deployed().then(async(instance) =>{
            //import { ethers } from "./../../node_modules/ethers";
            let collectible_id = document.getElementById('collectible_input').value; // <input name="one"> element
            await instance.buy_collectibles(collectible_id, {from: App.account, value: App.price.toString()});
        });
    },





    
}

/* TODO: ALTRO MODO PER OTTENERE ACCOUNT, VERIFICA */
function mostraAccount() {
    web3.eth.getAccounts()
            .then(console.log);
}

/* AGGIORNA I DIV DA MOSTRARE IN BASE ALL'ACCOUNT SU MM */
function change_mode(when){
    console.log("dentro change");
    let speed;
    if(when==1)
        speed=500;
    else
        speed=0;

    if(App.current_account_type == "operator"){
        $("#operator_interface").show(speed);
        $("#user_interface").hide(speed);        
    }
    else{
        $("#user_interface").show(speed);
        $("#operator_interface").hide(speed);
    }  
}





// Call init whenever the window loads
$(function() {
    $(window).on('load', function () {
        App.init();
    });
});