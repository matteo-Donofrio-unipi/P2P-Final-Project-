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
            let res = await instance.get_lottery_state({from: App.account});
            console.log("OPer  "+res);
            $("#lotteryState").html("Lottery State: "+res);
            res = await instance.get_operator({from: App.account});
            console.log("OPer  "+res);
            App.operator = res.toLowerCase();
            console.log("Get assegna");
            App.setAccountType();
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
                $("#collectibleBought").html(event);
                console.log(event);
                // If event has parameters: event.returnValues.valueName
            });

            instance.NFT_minted_now().on('data', function (event) { //click is the name of the event
                $("#lastNFTMinted").html(event);
                console.log(event);
                // If event has parameters: event.returnValues.valueName
            });



            instance.start_new_round().on('data', function (event) {
                $("#lotteryPhase").html("Buy Phase");
                console.log(event);
                // If event has parameters: event.returnValues.valueName
            });

            instance.start_extraction_phase().on('data', function (event) {
                $("#lotteryPhase").html("Extraction Phase");
                console.log(event);
                // If event has parameters: event.returnValues.valueName
            });

            instance.start_reward_phase().on('data', function (event) {
                $("#lotteryPhase").html("Reward Phase");
                console.log(event);
                // If event has parameters: event.returnValues.valueName
            });




            instance.ticket_bought().on('data', function (event) { //click is the name of the event
                $("#lastTicketBought").html(event);
                console.log(event);
                // If event has parameters: event.returnValues.valueName
            });

            instance.prize_assigned().on('data', function (event) { //click is the name of the event
                $("#prizesAssigned").html(event);
                console.log(event);
                // If event has parameters: event.returnValues.valueName
            });
            
            instance.lottery_closed().on('data', function (event) { //click is the name of the event
                App.lottery_state = "Closed";
                $("#lotteryState").html("Lottery State: Closed");
                console.log(event);
                // If event has parameters: event.returnValues.valueName
            });

            instance.values_drawn().on('data', function (event) { //click is the name of the event
                $("#drawnNumbers").html(event);
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

        // verifica se è operator o no
        if(App.account == App.operator)
            App.current_account_type="operator";
        else
            App.current_account_type="user";

        console.log("setAccountType detect: " + App.account + " of type: " + App.current_account_type);

        // aggiorna i dati mostrati
        $("#accountId").html("Your address: " + App.account);
        $("#accountType").html("Account type: " + App.current_account_type);
        $("#accountBalance").html("Account balance: " + App.current_account_type);
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
            let money = App.price.toNumber();
            await instance.buy_collectibles(collectible_id, {from: App.account, value: web3.utils.fromWei(money)});
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