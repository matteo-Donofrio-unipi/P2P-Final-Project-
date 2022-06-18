App = { // OGGETTO CON VARIABILI E METODI

    contracts: {},
    web3Provider: null,             // Web3 provider
    url: 'http://localhost:8545',   // Url for web3
    account: '0x0',
    account_balance: 0,
    operator: '0x0',                 // current ethereum account
    current_account_type : "operator",


    init: function() {

        return App.initWeb3();
    },

    /* initialize Web3 */
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
        $.getJSON("DAppContract.json").done(function(c) {
            App.contracts["Contract"] = TruffleContract(c);
            App.contracts["Contract"].setProvider(App.web3Provider);

            return App.initOperator();
        });
    },


    initOperator: function(){
        console.log("Dentro initOperator");
        App.contracts["Contract"].deployed().then(async(instance) =>{
            let res = await instance.get_operator({from: App.account});
            App.operator = res.toLowerCase();
            console.log("Get assegna");
            App.setAccountType();
        }); 
        return App.listenForEvents();
    },



    // Write an event listener
    listenForEvents: function() {
        console.log("Dentro listen");
        App.contracts["Contract"].deployed().then(async (instance) => {

            // web3.eth.getBlockNumber(function (error, block) {
                // click is the Solidity event
                instance.click().on('data', function (event) {
                    $("#eventId").html("Event catched!");
                    console.log("Event catched");
                    console.log(event);
                    // If event has parameters: event.returnValues.valueName
                });
            // });

        });

        ethereum.on('accountsChanged', function (accounts) {
            console.log("Eth evetn");
            App.setAccountType(); 
        });
    },


    // Call a function from a smart contract
        // The function send an event that triggers a transaction:: Metamask opens to confirm the transaction by the user
    pressClick: function() {

        App.contracts["Contract"].deployed().then(async(instance) =>{
            await instance.pressClick({from: App.account});
        });
    },

    //gestire balance receiver
    setAccountType: async function(){

        let accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        App.account = accounts[0].toLowerCase();

        if(App.account == App.operator)
            App.current_account_type="operator";
        else
            App.current_account_type="user";

        console.log("setAccountType detect: " + App.account + " of type: " + App.current_account_type);

        $("#accountId").html("Your address: " + App.account);
        $("#accountType").html("Account type: " + App.current_account_type);
        $("#accountBalance").html("Account balance: " + App.current_account_type);
        change_mode(0);     
    }




    
}

function mostraAccount() {
    web3.eth.getAccounts()
            .then(console.log);
}

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