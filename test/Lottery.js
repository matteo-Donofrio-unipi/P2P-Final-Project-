// Testing the contract
    // Invoking its functions and check they work as intended

// Truffle exclusive command: fetch the compilation from build/contracts
    // The result is the "class" (template) of the contract
    // In "" the name of the file in build/contracts, which is the same of the name of the contract and not of the solidity source file
    const Lottery_Template = artifacts.require("Lottery")

    // Testing environment is and extension of Mocha, javascript
    // Test a contract
        // the callback of contract() accepts in input the array of accounts, addresses, used in testing
            // e.g. taken from ganach    
    
    contract("Lottery", function(accounts) {
    
        //const operator = accounts[0]
        const price = 1000000000000000000;
        const balance_receiver = accounts[1]
        const user1 = accounts[2]
        const user2 = accounts[3]
        const user3 = accounts[4]
        const user4 = accounts[5]
        const user5 = accounts[6]
        const user6 = accounts[7]

        let result;
    
        // Test a function
        describe("Constructor", function() {
    
            it("Should create the contract correctly", async function() {
    
                // Metadata to the functions to set parameters like
                    // from: the sender address
                    // value: the amount of *wei* sent to payable functions
                    // gas: the gas limit 
                    // gasprice: the gas price
                const Lottery_Instance = await Lottery_Template.new({from: accounts[0]})

                //result = await Lottery_Instance.init_side_contracts({from: accounts[0]})
               // console.log(result)
    
                const ticket_price = await Lottery_Instance.price_tricket({from: accounts[0]})
                const operator = await Lottery_Instance.operator({from: accounts[0]})
                /*
                console.log("Ticket Price:")
                console.log(ticket_price)
                console.log("Operator:")
                console.log(operator)
                */
                result = await Lottery_Instance.set_balance_receiver(balance_receiver, {from: operator})
                const bal_rec = await Lottery_Instance.balance_receiver({from: operator})
                
                for (let i = 1; i < 9; i++) 
                    await Lottery_Instance.buy_collectibles(i, {from: operator, value: price.toString()})
                
                //START NEW ROUND
                await Lottery_Instance.start_New_Round({from: operator})

                
                let array1 = [1,2,3,4,5,6];
                let array2 = [7,8,9,10,11,12];
                let array3 = [13,14,15,16,17,18];
                let array4 = [19,20,21,22,23,24];
                let array5 = [25,26,27,28,29,11];
                let array6 = [30,33,35,54,61,23];

                try {
                    await Lottery_Instance.buy_ticket(array1, {from: user1, value: price.toString()})
                    await Lottery_Instance.buy_ticket(array2, {from: user2, value: price.toString()})
                    await Lottery_Instance.buy_ticket(array3, {from: user3, value: price.toString()})
                    await Lottery_Instance.buy_ticket(array4, {from: user4, value: price.toString()})
                    await Lottery_Instance.buy_ticket(array5, {from: user5, value: price.toString()})
                    await Lottery_Instance.buy_ticket(array6, {from: user6, value: price.toString()})
                } catch (e) {
                    console.log(e.reason, "1");
                }


                await Lottery_Instance.draw_numbers({from: operator})

                await Lottery_Instance.compute_prizes({from: operator})

                await Lottery_Instance.give_prizes({from: operator})

                await Lottery_Instance.start_New_Round({from: operator})

                
                
                

            })
    
        }) 
    })
