App = { // OGGETTO CON VARIABILI E METODI

    contracts: {},
    web3Provider: null,             // Web3 provider
    url: 'http://localhost:8545',   // Url for web3
    account: '0x0',
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
                    ethereum.request({ method: 'eth_requestAccounts' }).then(async() => {
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

        // Get current account
        web3.eth.getCoinbase(function(err, account) {
            if(err == null) {
                App.account = account;
                operator = account;
                App.current_account_type = "operator";
                $("#accountId").html("Your address: " + account);
                $("#accountType").html("Your type: " + App.current_account_type);
            }
        });

        // Load content's abstractions
        $.getJSON("DAppContract.json").done(function(c) {
            App.contracts["Contract"] = TruffleContract(c);
            App.contracts["Contract"].setProvider(App.web3Provider);

            return App.listenForEvents();
        });
    },

    // Write an event listener
    listenForEvents: function() {

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

            /*
            instance.give_operator().on('data', function (event) {
                $("#valueIdSecondo").html("Operator is :" + event.args[0]);
                console.log("Event catched 2");
                console.log(event);
                // If event has parameters: event.returnValues.valueName
            });
            */

        });


        ethereum.on('accountsChanged', function (accounts) {
            if(accounts[0]==operator)
                App.current_account_type = "operator";
            else
                App.current_account_type = "user";
            App.account = accounts[0];

            $("#accountId").html("Your address: " + App.account);
            $("#accountType").html("Your type: " + App.current_account_type);
            

        });

        return App.render();
    },

    // Get a value from the smart contract
    render: function() {

        App.contracts["Contract"].deployed().then(async(instance) =>{

            const v = await instance.value(); // Solidity uint are Js BN (BigNumbers) 
            console.log(v.toNumber());
            $("#valueId").html("" + v);
        });
    },

    // Call a function from a smart contract
        // The function send an event that triggers a transaction:: Metamask opens to confirm the transaction by the user
    pressClick: function() {

        App.contracts["Contract"].deployed().then(async(instance) =>{

            await instance.pressClick({from: App.account});
        });
    },

    getOperator: function() {

        App.contracts["Contract"].deployed().then(async(instance) =>{
            let res = await instance.get_operator({from: App.account});
            $("#valueIdSecondo").html("Operator is :" + res.logs[0].args[0]);
            //$("#mainUI").hide();
            App.operator = res.logs[0].args[0];
            //console.log(res);
        });
    }
    
}

function mostraAccount() {
    web3.eth.getAccounts()
            .then(console.log);
}





// Call init whenever the window loads
$(function() {
    $(window).on('load', function () {
        App.init();
    });
});