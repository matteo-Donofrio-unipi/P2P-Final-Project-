App = { // OGGETTO CON VARIABILI E METODI

    contracts: {},
    web3Provider: null,             // Web3 provider
    url: 'http://localhost:8545',   // Url for web3
    account: '0x0',
    account_balance: 0,
    operator: '0x0',                 // current ethereum account
    current_account_type : "operator",
    lottery_state : "Open",
    lottery_phase : "Not started",
    price : 1000000000000000000n,
    max_collectible_id : 0,


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

            //set the max collectible id
            App.max_collectible_id = await instance.get_max_collectible_id({from: App.account});

            //get the contract balance 
            res = await instance.get_contract_balance({from: App.account});
            $("#lotteryBalanceOperator").html("Lottery balance: "+res);


            //get the balance receiver (if set, else ret the 0x0 address)
            res = await instance.balance_receiver({from: App.account});
            $("#balanceReceiverFieldOperator").html("Balance Receiver: "+res);

            //get the last collectible bought 
            let num = await instance.get_num_collectibles_bought({from: App.account});
            if(num>0){
                for(let i = 0; i < num; i++){
                    res = await instance.get_collectible_info(i, {from: App.account});
                    $("#listCollectiblesBoughtOperator").append("<br> "+res+"<br>");
                }
            }
            console.log("LCB "+res);


            //get the list of NFTs minted (if set)
            num = await instance.get_num_NFTs_minted({from: App.account});
            if(num>0){
                for(let i = 0; i < num; i++){
                    res = await instance.get_NFT_information(i, {from: App.account});
                    console.log("NTFMINTATO "+res[0]);
                    $("#listNFTsMintedOperator").append("<br>Owner: "+res[0]+"<br>NFT description: "+res[1]+"<br> NFT class: "+res[2]+"<br> NFT ID: "+res[3]+"<br>");
                    
                    if(App.account == res[0].toLowerCase() && App.account != App.operator){
                        $("#NFTWonUser").append("<br>NFT description: "+res[1]+"<br> NFT class: "+res[2]+"<br> NFT ID: "+res[3]+"<br>");    
                }
                }
            }


            //get the lottery phase
            res = await instance.lottery_phase_operator({from: App.account}); 
            App.lottery_phase = res; 
            $("#lotteryPhaseOperator").html("Lottery Phase: "+res);
            if(res == "Not_started" || res == "Buy_phase" || res == "Extraction_phase" || res == "Give_prizes_phase" || res == "Closed")
                $("#lotteryPhaseUser").html("Lottery Phase: "+res);


            //get the last ticket bought (if set)
            try{
                num = await instance.get_num_tickets_sold({from: App.account});
                if(num>0){
                    for(let i = 0; i < num; i++){
                        res = await instance.get_ticket_information(i, {from: App.account});

                        if(res[1][0]==0){ //res[0] = address, res[1] = array di valori scelti 
                            res = "No ticket bought so far";
                            $("#ticketsSoldOperator").html("Last Ticket Bought: "+res);
                        }
                        else
                            $("#ticketsSoldOperator").append("<br> Owner: "+res[0]+"<br> values: ["+res[1]+"] <br>");
                            if(App.account == res[0].toLowerCase())
                                $("#ticketsBoughtUser").append("<br>["+res[1]+"] ");
                    } 
                }
            }
            catch{
                res = "No ticket bought so far";
                $("#ticketsSoldOperator").html("Last Ticket Bought: "+res);
                $("#ticketsSoldUser").html("Last Ticket Bought: "+res);
            }

            
            //get the lottery state
            res = await instance.lottery_state({from: App.account});
            $("#lotteryStateUser").html("Lottery State: "+res);
            $("#lotteryStateOperator").html("Lottery State: "+res);


            //get the drawn numbers
            try{
                res = await instance.drawn_numbers({from: App.account});
            }
            catch{
                res = "Will be drawn later";
            }
            $("#drawnNumbersOperator").html("Drawn numbers: "+res);
            $("#drawnNumbersUser").html("Drawn numbers: "+res);

        }); 
        return App.listenForEvents();
    },


    /* 4 */
    // set of function handler for each event emitted 
    listenForEvents: function() {
        console.log("Dentro listen");
        App.contracts["Contract"].deployed().then(async (instance) => {

            /*
            instance.print().on('data', function (event) {
                $("#title").html("Len: "+event["returnValues"][0]+" "+event["returnValues"][1]);
                console.log("eventoPReso1"+event["returnValues"][0]+" "+event["returnValues"][1]);
                // If event has parameters: event.returnValues.valueName
            });
            */


            instance.bal_initialized().on('data', function (event) {
                $("#balanceReceiverFieldOperator").html("Balance Receiver: "+event.args.receiver);
                console.log("eventoPReso2"+event.args.receiver);
                // If event has parameters: event.returnValues.valueName
            });

            instance.collectible_bought().on('data', function (event) { //click is the name of the event
                $("#listCollectiblesBoughtOperator").append("<br> "+event.args[1]);
                console.log(event);
                // If event has parameters: event.returnValues.valueName
            });

            instance.NFT_minted_now().on('data', function (event) { //click is the name of the event
                $("#listNFTsMintedOperator").append("<br>Owner: "+event.returnValues[0]+"<br>NFT description: "+event.returnValues[1]+"<br> NFT class: "+event.returnValues[2]+"<br> NFT ID: "+event.returnValues[3]+"<br>");
                if(App.account == event.returnValues[0].toLowerCase() && App.account != App.operator){
                    $("#NFTWonUser").append("<br>NFT description: "+event.returnValues[1]+"<br> NFT class: "+event.returnValues[2]+"<br> NFT ID: "+event.returnValues[3]+"<br>");    
                }
                console.log(event);
                // If event has parameters: event.returnValues.valueName
            });


            instance.NFT_transfered().on('data', function (event) { //click is the name of the event
                $("#listNFTsMintedOperator").append("<br> Last NFT Transfered: "+event.returnValues[0]+" "+event.returnValues[1]+" "+event.returnValues[2]+"<br> NFT ID: "+event.returnValues[3]+"<br>");
                if(App.account == event.returnValues[0].toLowerCase()){
                    $("#NFTWonUser").append("<br>NFT description: "+event.returnValues[1]+"<br> NFT class: "+event.returnValues[2]+"<br> NFT ID: "+event.returnValues[3]+"<br>");    
                }
                console.log(event);
                // If event has parameters: event.returnValues.valueName
            });
            



            instance.phase_change().on('data', function (event) {
                App.lottery_phase = event["returnValues"][0]; 
                $("#lotteryPhaseOperator").html("Lottery Phase: "+event["returnValues"][0]);
                if(event["returnValues"][0] == "Not Started" || event["returnValues"][0] == "Buy_phase" || event["returnValues"][0] == "Extraction_phase" || event["returnValues"][0] == "Give_prizes_phase" || event["returnValues"][0] == "Closed")
                    $("#lotteryPhaseUser").html("Lottery Phase: "+event["returnValues"][0]);
                
                // If event has parameters: event.returnValues.valueName
            });


            instance.ticket_bought().on('data', function (event) {
                $("#ticketsSoldOperator").append("<br>by: "+event["returnValues"][0]+ " is ["+event["returnValues"][1]+"]");
                if(App.account == event.returnValues[0].toLowerCase()){
                    $("#ticketsBoughtUser").append("<br>["+event["returnValues"][1]+"]"+"<br> ");    
                }
                console.log("TICKETTO "+event["returnValues"][0]+" "+event["returnValues"][1]);
                // If event has parameters: event.returnValues.valueName
            });

                //console.log("LTB2: "+JSON.stringify(event).returnValues[0]);
                //console.log(Object.getOwnPropertyNames(object1));
            
            instance.lottery_closed().on('data', function (event) { //click is the name of the event
                App.lottery_state = "Closed";
                $("#lotteryStateOperator").html("Lottery State: Closed");
                $("#lotteryPhaseOperator").html("Lottery Phase: Closed");
                $("#lotteryStateUser").html("Lottery State: Closed");
                $("#lotteryPhaseUser").html("Lottery Phase: Closed");
                console.log(event);
                // If event has parameters: event.returnValues.valueName
            });

            instance.values_drawn().on('data', function (event) { //click is the name of the event
                $("#drawnNumbersOperator").html("Drawn numbers: "+event.returnValues[0]);
                $("#drawnNumbersUser").html("Drawn numbers: "+event.returnValues[0]);
                console.log(event);
                // If event has parameters: event.returnValues.valueName
            });

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
        change_mode();     
    },

    /* SET DI FUNZIONI CHE INVOCANO LE FUNZIONI DELLO SMART CONTRACT */


    setBalancerReceiver: function() {
        if(App.lottery_phase != "Not_started"){
            alert("Wrong phase for this action, actual phase is: "+App.lottery_phase);
            return;
        }
        App.contracts["Contract"].deployed().then(async(instance) =>{
            try{
                let address_string = document.getElementById('balanceReceiver').value.toLowerCase(); // <input name="one"> element
                let address = web3.utils.toChecksumAddress(address_string);
                await instance.set_balance_receiver(address,{from: App.account});
            }
            catch(err){
                alert(err); 
            }
            
            
        });
    },

    startNewRound: function() {
        if(App.lottery_phase != "Init_phase"){
            alert("Wrong phase for this action, actual phase is: "+App.lottery_phase);
            return;
        }
        App.contracts["Contract"].deployed().then(async(instance) =>{
            try{
                await instance.start_New_Round({from: App.account});
            }
            catch(err){
                alert(err);
            }
        });
    },

    drawNumbers: function() {
        if(App.lottery_phase != "Extraction_phase"){
            alert("Wrong phase for this action, actual phase is: "+App.lottery_phase);
            return;
        }
        App.contracts["Contract"].deployed().then(async(instance) =>{
            try{
                await instance.draw_numbers({from: App.account});
            }
            catch(err){
                alert(err);
            }
        });
    },

    computePrizes: function() {
        if(App.lottery_phase != "Compute_prizes_phase"){
            alert("Wrong phase for this action, actual phase is: "+App.lottery_phase);
            return;
        }
        App.contracts["Contract"].deployed().then(async(instance) =>{
            try{
                await instance.compute_prizes({from: App.account});
            }
            catch(err){
                alert(err);
            }
        });
    },

    givePrizes: function() {
        if(App.lottery_phase != "Give_prizes_phase"){
            alert("Wrong phase for this action, actual phase is: "+App.lottery_phase);
            return;
        }
        App.contracts["Contract"].deployed().then(async(instance) =>{
            try{
                await instance.give_prizes({from: App.account});
            }
            catch(err){
                alert(err);
            }
        });
    },

    closeLottery: function() {
        if(App.lottery_state != "Open"){
            alert("Wrong state for this action, actual state is: "+App.lottery_state);
            return;
        }
        App.contracts["Contract"].deployed().then(async(instance) =>{
            try{
                await instance.close_lottery({from: App.account});
            }
            catch(err){
                alert(err);
            }
        });
    },

    buyCollectible: function() {
        if(App.lottery_phase != "Not_started"){
            alert("Wrong phase for this action, actual phase is: "+App.lottery_phase);
            return;
        }
        App.contracts["Contract"].deployed().then(async(instance) =>{
            try{
                let collectible_id = document.getElementById('collectible_input').value; // <input name="one"> element
                await instance.buy_collectibles(collectible_id, {from: App.account, value: App.price.toString()});
            }
            catch(err){
                alert("Wrong collectible or collectible already bought");
            }
        });
    },

    //FUN USER SIDE

    buyTicket: function() {
        if(App.lottery_phase != "Buy_phase"){
            alert("Wrong phase for this action, actual phase is: "+App.lottery_phase);
            return;
        }
        App.contracts["Contract"].deployed().then(async(instance) =>{
            try{
                let input_values = [];
                for(let i =1; i< 7; i++)
                    input_values.push((document.getElementById('number_input'+i).value));

                console.log("VALORI "+input_values);

                await instance.buy_ticket(input_values, {from: App.account, value: App.price.toString()});
            }
            catch(err){
                //console.log(Object.getOwnPropertyNames(err));
                alert(err);
            }
        });
    },





    
}

/* TODO: ALTRO MODO PER OTTENERE ACCOUNT, VERIFICA */
function mostraAccount() {
    web3.eth.getAccounts()
            .then(console.log);
}

/* AGGIORNA I DIV DA MOSTRARE IN BASE ALL'ACCOUNT SU MM */
function change_mode(){
    console.log("dentro change");


    if(App.current_account_type == "operator"){
        $("#operator_interface").show();
        $("#user_interface").hide();                
    }
    else{
        $("#user_interface").show();
        $("#operator_interface").hide();
    } 
    
    //svuoto le liste di NFT e ticket, essendo specifiche per ogni utente
    $("#ticketsBoughtUser").html("List of Tickets Bought:");  
    $("#NFTWonUser").html("Last rewards obtained:");  
}


// Call init whenever the window loads
$(function() {
    $(window).on('load', function () {
        App.init();
    });
});