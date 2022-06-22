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
    counter : 0,


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

            return App.initDApp();
        });
    },

    /* 3 */
    /* Initialize Dapp state variable & printed information */
    initDApp: function(){
        console.log("Dentro initOperator");

            //get the lottery operator
            get_lottery_operator();

            //set the max collectible id
            set_max_collectible_id();

            //get the contract balance 
            get_contract_balance();


            //get the balance receiver (if set, else ret the 0x0 address)
            get_balance_receiver();

            //get the list of all collectibles bought
            get_list_collectibles_bought(); 


            //get the list of NFTs minted (if set)
            get_list_NFTs();


            //get the lottery phase
            get_lottery_phase();

            //get the last ticket bought (if set)
            get_list_tickets();

            
            //get the lottery state
            get_lottery_state();

            get_drawn_numbers();

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

            instance.collectible_bought().on('data', function (event) { 
                $("#listCollectiblesBoughtOperator").append("<br> "+event.args[1]);
                console.log(event);
                // If event has parameters: event.returnValues.valueName
            });

            instance.NFT_minted_now().on('data', function (event) { 
                App.counter>=7 && App.lottery_phase_operator == 'Init_phase'
                $("#listNFTsMintedOperator").append("<br>Owner: "+event.returnValues[0]+"<br>NFT description: "+event.returnValues[1]+"<br> NFT class: "+event.returnValues[2]+"<br> NFT ID: "+event.returnValues[3]+"<br>");
                if(App.account == event.returnValues[0].toLowerCase() && App.account != App.operator){
                    $("#NFTWonUser").append("<br>NFT description: "+event.returnValues[1]+"<br> NFT class: "+event.returnValues[2]+"<br> NFT ID: "+event.returnValues[3]+"<br>");    
                }
                console.log(event);
                App.counter++;
                // If event has parameters: event.returnValues.valueName
            });


            instance.NFT_transfered().on('data', function (event) { 
                $("#listNFTsMintedOperator").append("<br> Last NFT Transfered: Owner: "+event.returnValues[0]+"<br>NFT description: "+event.returnValues[1]+"<br> NFT class: "+event.returnValues[2]+"<br> NFT ID: "+event.returnValues[3]+"<br>");
                if(App.account == event.returnValues[0].toLowerCase()){
                    $("#NFTWonUser").append("<br>NFT description: "+event.returnValues[1]+"<br> NFT class: "+event.returnValues[2]+"<br> NFT ID: "+event.returnValues[3]+"<br>");    
                }
                console.log(event);
                // If event has parameters: event.returnValues.valueName
            });
            



            instance.phase_change().on('data', function (event) {
                App.lottery_phase = event["returnValues"][0]; 
                $("#lotteryPhaseOperator").html("Lottery Phase: "+event["returnValues"][0]);
                $("#lotteryPhaseUser").html("Lottery Phase: "+event["returnValues"][0]);
                
                // If event has parameters: event.returnValues.valueName
            });


            instance.ticket_bought().on('data', function (event) {
                $("#ticketsSoldOperator").append("<br> Owner: "+event["returnValues"][0]+ "<br> values: ["+event["returnValues"][1]+"]<br>");
                if(App.account == event.returnValues[0].toLowerCase()){
                    $("#ticketsBoughtUser").append("["+event["returnValues"][1]+"]"+"<br> ");    
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
            App.setAccountType(1); 
        });
    },


    //TODO: gestire balance receiver
    /* 1 */
    setAccountType: async function(whyIsInvoked){ //whyIsInvoked=0 if invoked when refreshed (so by get_operator), 1 if on change

        //ottiene l'address dell'account collegato su MM
        let accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        App.account = accounts[0].toLowerCase();

        //declare the new attribute balance
        App.account_balance = await web3.utils.fromWei(await web3.eth.getBalance(accounts[0]))

        // verifica se è operator o no
        if(App.account == App.operator)
            App.current_account_type="operator";
        else
            App.current_account_type="user";

        console.log("setAccountType detect: " + App.account + " of type: " + App.current_account_type);

        // aggiorna i dati mostrati
        $("#accountId").html("Your address: " + App.account);
        $("#accountType").html("Account type: " + App.current_account_type);
        $("#accountBalance").html("Account balance: " + App.account_balance); 

        set_interface(whyIsInvoked);  // based on the account type, display the output  
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
                $("#ticketsBoughtUser").html("List of Tickets Bought: ");
                $("#ticketsSoldOperator").html("List of Tickets Sold: ");
                $("#drawnNumbersOperator").html("Drawn numbers: Will be drawn later");
                $("#drawnNumbersUser").html("Drawn numbers: Will be drawn later");
                get_contract_balance();
                get_list_NFTs();
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
            let accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            App.account_balance = await web3.utils.fromWei(await web3.eth.getBalance(accounts[0]));
            $("#accountBalance").html("Account balance: " + App.account_balance); 
        });
    },

    buyAllCollectibles: function() {
        if(App.lottery_phase != "Not_started"){
            alert("Wrong phase for this action, actual phase is: "+App.lottery_phase);
            return;
        }
        App.contracts["Contract"].deployed().then(async(instance) =>{
            try{
                for(i=1; i<9; i++)
                    await instance.buy_collectibles(i, {from: App.account, value: App.price.toString()});
            }
            catch(err){
                alert("Wrong collectible or collectible already bought");
            }
            let accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            App.account_balance = await web3.utils.fromWei(await web3.eth.getBalance(accounts[0]));
            $("#accountBalance").html("Account balance: " + App.account_balance); 
        });
    },

    //FUN USER SIDE

    buyTicket: function() {
        if(App.lottery_phase != "Buy_phase"){
            alert("Wrong phase for this action, actual phase is: "+App.lottery_phase);
            return;
        }
        if(App.account == App.balance_receiver_address.toLowerCase()){
            alert("You can't buy tickets ");
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
            let accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            App.account_balance = await web3.utils.fromWei(await web3.eth.getBalance(accounts[0]));
            $("#accountBalance").html("Account balance: " + App.account_balance); 

        });
    },

}

function get_lottery_operator(){
    App.contracts["Contract"].deployed().then(async(instance) =>{
        let res = await instance.operator({from: App.account});  
        App.operator = res.toLowerCase();
        //set the account informations
        App.setAccountType(0);
    });    
}

function set_max_collectible_id(){
    App.contracts["Contract"].deployed().then(async(instance) =>{
        App.max_collectible_id = await instance.get_max_collectible_id({from: App.account});
    });    
}

function get_contract_balance(){
    App.contracts["Contract"].deployed().then(async(instance) =>{
        let res = await instance.get_contract_balance({from: App.account});
            $("#lotteryBalanceOperator").html("Lottery balance: "+res);
    });    
}


function get_balance_receiver(){
    App.contracts["Contract"].deployed().then(async(instance) =>{
        let res = await instance.balance_receiver({from: App.account});
        $("#balanceReceiverFieldOperator").html("Balance Receiver: "+res);
        App.balance_receiver_address = res.toLowerCase();
    });    
}

function get_list_collectibles_bought(){
    App.contracts["Contract"].deployed().then(async(instance) =>{
        let res;
        let num = await instance.get_num_collectibles_bought({from: App.account});
            if(num>0){
                $("#listCollectiblesBoughtOperator").html("List of Collectibles bought: ");
                for(let i = 0; i < num; i++){
                    res = await instance.get_collectible_info(i, {from: App.account});
                    $("#listCollectiblesBoughtOperator").append("<br> "+res);
                }
            }
            console.log("LCB "+res);
    });    
}

function get_list_NFTs(){
    App.contracts["Contract"].deployed().then(async(instance) =>{
        let res;
        let num = await instance.get_num_NFTs_minted({from: App.account});
            if(num>0){

                $("#listNFTsMintedOperator").empty();
                $("#listNFTsMintedOperator").html("List of NFTs Minted: ");

                $("#NFTWonUser").empty();
                $("#NFTWonUser").html("List of rewards obtained: ");
                for(let i = 0; i < num; i++){
                    res = await instance.get_NFT_information(i, {from: App.account});
                    console.log("NTFMINTATO "+res[0]);
                    $("#listNFTsMintedOperator").append("<br>Owner: "+res[0]+"<br>NFT description: "+res[1]+"<br> NFT class: "+res[2]+"<br> NFT ID: "+res[3]+"<br>");
                    
                    if(App.account == res[0].toLowerCase() && App.account != App.operator){
                        $("#NFTWonUser").append("<br>NFT description: "+res[1]+"<br> NFT class: "+res[2]+"<br> NFT ID: "+res[3]+"<br>");    
                    }   
                }
            }
    });    
}

function get_lottery_phase(){
    App.contracts["Contract"].deployed().then(async(instance) =>{
        let res = await instance.lottery_phase_operator({from: App.account}); 
            App.lottery_phase = res; 
            $("#lotteryPhaseOperator").html("Lottery Phase: "+res);
            $("#lotteryPhaseUser").html("Lottery Phase: "+res);
                

    });    
}

function get_list_tickets(){
    App.contracts["Contract"].deployed().then(async(instance) =>{
        let res;
        try{
            let num = await instance.get_num_tickets_sold({from: App.account});
            if(num>0){
                $("#ticketsSoldOperator").empty();
                $("#ticketsSoldOperator").html("List of Tickets Sold: ");

                $("#ticketsBoughtUser").empty();
                $("#ticketsBoughtUser").html("List of Tickets Bought: ");
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

    });    
}

function get_lottery_state(){
    App.contracts["Contract"].deployed().then(async(instance) =>{
        let res = await instance.lottery_state({from: App.account});
            $("#lotteryStateUser").html("Lottery State: "+res);
            $("#lotteryStateOperator").html("Lottery State: "+res);
    });    
}

function get_drawn_numbers(){
    App.contracts["Contract"].deployed().then(async(instance) =>{
            //get the drawn numbers
            let res;
            try{
                res = await instance.get_drawn_numbers({from: App.account});
            }
            catch{
                res = "Will be drawn later";
            }
            if(res[0]==0)
                res = "Will be drawn later";
            $("#drawnNumbersOperator").html("Drawn numbers: "+res);
            $("#drawnNumbersUser").html("Drawn numbers: "+res);
            

    });    
}

function funzione_print(){
    App.contracts["Contract"].deployed().then(async(instance) =>{
    let res = await instance.contatore({from: App.account});
                console.log("CONTATORE "+res);
    });
}




/* AGGIORNA I DIV DA MOSTRARE IN BASE ALL'ACCOUNT SU MM */
function set_interface(whyIsInvoked){
    console.log("dentro change");

    //Based on account type display a specific interface
    if(App.current_account_type == "operator"){
        $("#operator_interface").show();
        $("#user_interface").hide();                 
    }
    if(App.current_account_type == "user"){
        $("#user_interface").show();
        $("#operator_interface").hide();
    } 
    
    //if whyIsInvoked==0 => this fun is invoked on a page load/refresh, so the function App.initDApp set the right interface
    //if whyIsInvoked==1 => this fun is invoked on an eth account change, so just the NFTs and Ticket must be recomputed for the specific account
    if(whyIsInvoked==1){
        get_list_NFTs();
        get_list_tickets();
        get_lottery_phase();
        get_lottery_state();
    }
    
    
    //svuoto le liste di NFT e ticket, essendo specifiche per ogni utente
    
}


// Call init whenever the window loads
$(function() {
    $(window).on('load', function () {
        App.init();
    });
});