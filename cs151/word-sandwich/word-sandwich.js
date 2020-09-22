//SELECT ELEMENTS AND ASSIGN THEM TO VARS
var topBreadDiv = document.querySelector('#topBread');
var middleDiv = document.querySelector('#middle');
var bottomBreadDiv = document.querySelector('#bottomBread');
var statusDiv = document.querySelector('#status');
var userInput = document.querySelector('#userGuess');
var goButton = document.querySelector('#goBtn');

function enterWord()
{
  statusDiv.innerText = "You entered " + userInput.value;
}

// Execute a function when the user releases a key on the keyboard
userInput.addEventListener("keyup", function(event) {
  // Number 13 is the "Enter" key on the keyboard
  if (event.keyCode === 13) {
    // Cancel the default action, if needed
    event.preventDefault();
    // Trigger the button element with a click
    goButton.click();
  }
});

// readTextFile();
// function readTextFile() {
//   var rawFile = new XMLHttpRequest();
//   rawFile.open("GET", "hiddenWords.txt", true);
//   rawFile.onreadystatechange = function() {
//     if (rawFile.readyState === 4) {
//       var allText = rawFile.responseText;
//       hiddenWords = allText;
//       console.log( "Loaded hiddenWords.")
//     }
//   }
//   rawFile.send();
// }

fetch('hiddenWords.txt')
  .then(response => response.text())
  .then(text => console.log(text))