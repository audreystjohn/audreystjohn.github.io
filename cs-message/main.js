//Show Instructions
const helpModal = document.getElementById('helpModal');
function openHelpModal() {
    helpModal.classList.add('show-modal');
}

function closeHelpModal() {
    helpModal.classList.remove('show-modal');
}

// Main Game Play
let cardElements = document.getElementsByClassName('game-card');
let cardElementsArray = [...cardElements];
let imgElements = document.getElementsByClassName('game-card-img');
let imgElementsArray = [...imgElements];

startGame();

function startGame() {
    for(i=0; i<imgElementsArray.length; i++) {
        //remove all images from previous games from each card (if any)
        cardElements[i].innerHTML = "";

        var a = document.createElement('a');
        a.href = imgElementsArray[i].src;
        a.appendChild(imgElementsArray[i]);

        //add the shuffled images to each card
        cardElements[i].appendChild(a);
        cardElements[i].type = `${imgElementsArray[i].alt}`;

        //remove all extra classes for game play
        cardElements[i].classList.remove("show", "open", "match", "disabled");
        cardElements[i].children[0].children[0].classList.remove("show-img");
    }

    //listen for events on the cards
    for(let i = 0; i < cardElementsArray.length; i++) {
        cardElementsArray[i].addEventListener("click", displayCard)
    }
}

function displayCard() {
    this.children[0].classList.add('show-img');
    this.children[0].children[0].classList.add('show-img');
    this.classList.add("open");
    this.classList.add("show");
    this.removeEventListener("click", displayCard)
}

function playAgain() {
    modalElement.classList.remove("show-modal");
    startGame();
}