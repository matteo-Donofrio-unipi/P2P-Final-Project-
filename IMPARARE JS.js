//////////////////VARIABLES//////////////////

//variables types are dynamic 
let message = "This"; //variable
const DATE = '18.04.1982';
// the "n" at the end means it's a BigInt
const bigInt = 1234567890123456789012345678901234567890n;

let str = "Hello";
let phrase = `can embed another ${str}`; //require the strange virgolette
let res = `the result is ${1 + 2}`;
let nameFieldChecked = true; //bool
let age = null; // t’s just a special value which represents “nothing”, “empty” or “value unknown”.
let age2;//UNDEFINED VALUE 

//undefined => is a variable. Null => object

//////////////////FUNCTIONS//////////////////

//FUNCTIONS DECLARATIONS

// this statement assign the fun code to the sum variable
//A Function Declaration can be called earlier than it is defined.
function sum(a, b) {
    return a + b;
} 

let sumVariable = sum(5,6); //store the result of the fun exec
let sumFun = sum; //store the fun cod into the sumFun variable  


//FUNCTION EXPRESSIONS


//this is a Function Expression (lambda fun)
//it assigns the result to the varaible somma, so the fun is anonimus 
//A Function Expression is created when the execution reaches it and is usable only from that moment.
let somma = function() {
    return 5+1;
};

//functions can be passed as parameters
function ask(question, yes, no) {
    if (confirm(question)) yes()
    else no();
  }
  
  ask(
    "Do you agree?",
    function() { alert("You agreed."); },
    function() { alert("You canceled the execution."); }
  );


//ARROW FUNCTIONS

let sayHi = () => alert("Hello!"); //no args

let double = n => n * 2; //single arg

let sum = (a, b) => a + b; //more than one arg

//arrow fun with more than one instruction
let sum = (a, b) => {  // the curly brace opens a multiline function
    let result = a + b;
    return result; // if we use curly braces, then we need an explicit "return"
  };



//////////////////OBJECTS//////////////////

//OBJECTS ATTRIBUTES

//declare an empty object
let user = new Object(); // "object constructor" syntax
let user2 = {}; 

//declare a structured object
let user3 = {     // an object
    name: "John",  // by key "name" store value "John"
    age: 30        // by key "age" store value 30
  };

//NB: attributes can be added/removed in any time
user3.isAdmin = true; // add
delete user3.age; //remove

alert( user.noSuchProperty === undefined ); //test if an attributed exists or not
alert( "age" in user ); //same

for (key in object) { // executes the body for each key among object properties
}

obj["property"] // another way to access to the attributes

//OBJECTS METHODS

// first, declare
function sayHi() {
    alert("Hello!");
  }  
// then add as a method
user.sayHi = sayHi;

//another way to do thiss
user = {
    sayHi() { // same as "sayHi: function(){...}"
      alert("Hello");
    }
  };


//THIS 
user = {
    sayHi() { // same as "sayHi: function(){...}"
      alert(this.name);
    }
  };

user.sayHi(); // print the name of the obj

// OBJ CONSTRUCTORS

//equivalent to a class creation
function ClassName(name) {
    this.name = name;
      
    this.sayHi = function() {
        alert( "My name is: " + this.name );
    };
}
  
let user3 = new ClassName("Jack"); //instantiate an obj of the class
user3.sayHi(); //invoke the class fun


//////////////////TRY-CATCH//////////////////
try {
    // ...
  } catch (err) { // <-- the "error object", could use another word instead of err
    // ...
  }

//ERR OBJECT CONTAINS:
//name, message

//////////////////PROMISES//////////////////

let promise_ = new Promise(function(resolve, reject) {
    // executor (the producing code, "singer")
});
/*
The function passed to new Promise is called the executor.
When new Promise is created, the executor runs automatically. 
It contains the producing code which should eventually produce the result 
*/


promise.then(
    function(result) { /* handle a successful result */ },
    function(error) { /* handle an error */ }
);
/*
The first argument of .then is a function that runs when the promise
is resolved, and receives the result.
The second argument of .then is a function that runs when the promise 
is rejected, and receives the error.
*/




//publisher
let promise = new Promise(function(resolve, reject) {
    if(all_exec_good)
        resolve("done!"); //may contain any res arg value
    else
        reject(new Error("Whoops!")); //may contain any err arg value
});
  
//subscriber
// resolve runs the first function in .then
promise.then(
    result => alert(result), // shows "done!" 
    error => alert(error) // shows "Error: Whoops!"
);

//if we're interested only in the result behaviour => just put one handler
promise.then(alert);


//ESEMPIO PRATICO1//

let arg = 6;

let produce = (val) => {
    if(val < 5)
      return true;
    else
      return false;
}


let promise11 = new Promise(function(resolve, reject) {
  if(produce(arg))
    return resolve("Valore buono");
  else
    return reject("Errore trovato");
});

// resolve runs the first function in .then
promise11.then(
  result => alert(result), //se arg < 5 stampa "valore buono"
  error => alert(error) //se arg >= 5 stampa "Errore trovato"
);

//FINE ESEMPIO PRATICO1 //


//ESEMPIO PRATICO2//
//stessa logica, ma:
                // la Promise restituisce un intero
                // promise.then implementa due funzioni diverse in base all'esito della promise.
let arg = 3;

let produce = (val) => {
    if(val < 5)
      return 1;
    else
      return 0;
}


let promise = new Promise(function(resolve, reject) {
  let res = produce(arg); 
  if(res)
    return resolve(res);
  else
    return reject(res);
});

// resolve runs the first function in .then
promise.then(
  result => {
    let v =result + 4;
    alert(v);
  }, 
  error => {
    let v =error + 3;
    alert(v);
  }
);

//FINE ESEMPIO PRATICO2 //



//////////////////ASYNC-AWAIT//////////////////

//ASYNC allow to avoid to put explicitily the Promise declaration,
// with async keyword => a function always returns a promise.

// INIZIO ESEMPIO PRATICO 3//
let val = 5;
async function f(val) {
  let temp = val + 2;
  return temp;
}

f(val).then(
  result => {
    let final = result + 3;
    alert(final); //stampa 10
  }
); // 1

// FINE ESEMPIO PRATICO 3//


//AWAIT CAN BE USED only inside async functions


// INIZIO ESEMPIO PRATICO 4 // 

let val = 5;

async function g(val){
  return val + 3;
}

async function f() {

  let result = await g(val); // wait until the promise resolves (*)

  alert(result); //stampa 8
}

f();

// FINE ESEMPIO PRATICO 4 // 


//////////////EVENT-HANDLER///////////////

//most basic way of reacting on an event:
// define an HTML element with some code inside
<input value="Click me" onclick="alert('Click!')" type="button"></input>


//here instead the code is longer, so it's put apart
//define an HTML elementi with the code apart
<script>
  function countRabbits() {
    for(let i=1; i<=3; i++) {
      alert("Rabbit number " + i);
    }
  }
</script>

<input type="button" onclick="countRabbits()" value="Count rabbits!"></input>



//define an HTML element, apart define an handler script
<input id="elem" type="button" value="Click me">
<script>
  elem.onclick = function() {
    alert('Thank you');
  };
</script>
</input>

// ADD EVENT LISTENERS
//Since each HTML element can handle 1 event, we need a way to add more event to a single element

element.addEventListener("click", handler, [options]); //handler is the fun, 
element.removeEventListener("click", handler, [options]);



/////////////////////EVENTS//////////////////////////
//When an event happens, the browser creates an event object,
// puts details into it and passes it as an argument to the handler

<input type="button" value="Click me" id="elem">

<script>
  elem.onclick = function(event) {
    // show event type, element and coordinates of the click
    alert(event.type + " at " + event.currentTarget);
    alert("Coordinates: " + event.clientX + ":" + event.clientY);
  };
</script>



