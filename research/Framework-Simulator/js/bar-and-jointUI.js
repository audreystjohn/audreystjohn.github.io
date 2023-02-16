var mouse, mouseConstraint;
var MOUSE_STIFFNESS = .005; // how "hard" the mouse pulls on the vertex
var pressedKeys = new Array();
var PINNING_KEY = "p";
var DELETION_KEY = "d";
var CONNECTION_KEY = "c";
var ADDITION_KEY = "a";
var EDIT_KEY = "e";
var MOVE_KEY = "m";
var SELECTED_STROKE_COLOR = "orange";

var DEFAULT_ICON_COLOR = "gray";
var SELECTED_ICON_COLOR = "green";

var PIN_MODE = "pin";
var MOVE_MODE = "move";
var CONNECT_MODE = "connect";
var CLEAR_MODE = "clear";
var DELETE_MODE = "delete";
var ADD_MODE = "add";
var EDIT_MODE = "edit";

var MODES =         [MOVE_MODE,PIN_MODE,CONNECT_MODE,ADD_MODE,EDIT_MODE,DELETE_MODE];
var KEY_SHORTCUTS = [MOVE_KEY,PINNING_KEY,CONNECTION_KEY,ADDITION_KEY,EDIT_KEY,DELETION_KEY];

var DEFAULT_MODE = MOVE_MODE;

var clickedCircle = null; // for tracking what mousedown event was over
var selectedCircle = null; // for connection mode
var currentMode;
var previousMode;

var mouseIsDown = false;

function initUI()
{
    // add mouse control
    mouse = Mouse.create(render.canvas);

    // keep the mouse in sync with rendering
    render.mouse = mouse;

    // this initializes the global mouseConstraint, which allows dragging
    // and lets us check if the mouse is on top of a body
    setupMouseConstraint();

    // this will be querying HTML mouse click/touch events
    setupCustomCanvasEvents();

    // this will be for checking the key that is held down
    setupKeyPressing();

    setupIconElts();

    currentMode = DEFAULT_MODE;

    setMode( currentMode );

    if ( document.getElementById("Frameworks") != null )
        setupBuiltIns();
    initFramework();
}

function setupCustomCanvasEvents()
{
    matterCanvas.addEventListener('mousedown', function (e) {
        customRespondToCanvas('down', e.offsetX, e.offsetY);
    });
    matterCanvas.addEventListener('mouseup', function (e) {
        customRespondToCanvas('up', e.offsetX, e.offsetY);
    });

    matterCanvas.addEventListener('mousemove', function (e) {
        // matterCanvas.addEventListener('click', function (e) {
            customRespondToCanvas('move', e.offsetX, e.offsetY);
    });

    matterCanvas.addEventListener('touchstart', function (e) {
        var touch = e.touches[0];
        var canvas = document.getElementById( 'matterJS-canvas' );
        var x = touch.pageX - canvas.offsetLeft;
        var y = touch.pageY - canvas.offsetTop;
        customRespondToCanvas("down",x,y);
    });

    matterCanvas.addEventListener('touchend', function (e) {
        var touch = e.changedTouches[0];
        var canvas = document.getElementById( 'matterJS-canvas' );
        var x = touch.pageX - canvas.offsetLeft;
        var y = touch.pageY - canvas.offsetTop;
        customRespondToCanvas("up",x,y);
    });

    matterCanvas.addEventListener('touchmove', function (e) {
        var touch = e.touches[0];
        var canvas = document.getElementById( 'matterJS-canvas' );
        var x = touch.pageX - canvas.offsetLeft;
        var y = touch.pageY - canvas.offsetTop;
        customRespondToCanvas("move",x,y);
    });
}

function customRespondToCanvas( eventType, x, y )
{
    var bodiesUnder = Query.point( Composite.allBodies(barAndJointComposite), { x: x, y: y });

    // we will track what was selected 
    if ( eventType === 'down' )
    {
        mouseIsDown = true;
        if ( bodiesUnder.length > 0 )
            clickedCircle = bodiesUnder[0];
        else
            clickedCircle = null;
    }
    else if ( eventType === "up" )
    {
        // if in ADD_MODE, add one
        if ( currentMode === ADD_MODE )
        {
            // console.log( "add a circle here");
            addCircle( nextID(), x, y );
        }
        // otherwise, if it's the same circle first pressed down on
        else if ( bodiesUnder.length > 0 && clickedCircle == bodiesUnder[0] )
        {

            // if we're pinning it
            if ( currentMode === PIN_MODE )
                togglePinning( clickedCircle );
            // otherwise, if we're selecting it
            else if ( currentMode === CONNECT_MODE )
                toggleSelection( clickedCircle );
            // otherwise, if we're deleting it
            else if ( currentMode === DELETE_MODE )
                deleteCircle( clickedCircle );
        }    
        mouseIsDown = false;
        clickedCircle = null;
    }
    else if ( eventType === "move" && mouseIsDown )
    {
        // if we're editing and there is a clicked circle
        if ( currentMode === EDIT_MODE && clickedCircle != null )
        {
            setPosition( clickedCircle.graphID, x, y );
        }        
    }

}

/** This helps with dragging and with convenience of knowing if mouse is interacting with matter bodies */
function setupMouseConstraint()
{
    mouseConstraint = MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                // allow bodies on mouse to rotate
                angularStiffness: 0,
                stiffness: MOUSE_STIFFNESS,
                // render: {
                //     visible: false
                // }
            }
        });

    Composite.add(world, mouseConstraint);
}

function setupKeyPressing()
{
    window.addEventListener('keydown', processKeyPress, false);
    window.addEventListener('keyup', processKeyUp, false);
}

function processKeyPress(e) 
{
    var keyVal = e.key.toLowerCase();
    console.log( `You pressed ${keyVal}` );
    for (var i = 0; i < KEY_SHORTCUTS.length; i++ ) 
        if ( keyVal === KEY_SHORTCUTS[i] )
            setMode( MODES[i] );
    
    if ( !pressedKeys.includes( keyVal ) )
        pressedKeys.push( keyVal );
}

function processKeyUp(e) 
{
    // console.log( `You released ${e.key}` );
    var keyVal = e.key.toLowerCase();
    for ( var i = pressedKeys.length - 1; i >= 0; i-- ) 
    { 
        if ( pressedKeys[i] === keyVal ) 
            pressedKeys.splice(i,1);
    }
    // reset to what the mode was prior
    if (pressedKeys.length == 0)
        setMode( previousMode );
}

function toggleSelection( circleBody ) 
{
    console.log( `selectedCircle: ${selectedCircle}`);

    // if nothing is previously selected
    if ( selectedCircle == null )
    {
        // select it
        selectedCircle = circleBody;

        // update its render property
        selectedCircle.render.lineWidth *= 2;
        selectedCircle.render.strokeStyle = SELECTED_STROKE_COLOR;
    }
    else {
        
        // if the previous selection different than this one, we're 
        // connecting (it could be that we were unselecting)
        if ( selectedCircle != circleBody )
            // add the constraint
            addConstraintBetween( selectedCircle.graphID, circleBody.graphID );

        // we want to reset
        resetStyle( selectedCircle );
        selectedCircle = null;
    }
    console.log( `selectedCircle is now: ${selectedCircle}`);

}

function resetStyle( circle )
{
    circle.render.lineWidth = CIRCLE_LINE_WIDTH;
    circle.render.strokeStyle = CIRCLE_STROKE_COLOR;
}

function setMode( mode )
{
    previousMode = currentMode;
    currentMode = mode;

    // if previous was an edit, need to add the mouse constraint back
    if ( previousMode === EDIT_MODE )
    {
        console.log( "previous was edit, putting mouse constraint back." );
        Composite.add(world, mouseConstraint);
    }

    // if changing mode to edit, need to remove the mouse constraint 
    if ( mode === EDIT_MODE )
    {
        console.log( "mode changing to edit, removing mouse constraint." );
        Composite.remove(world, mouseConstraint);
    }

    console.log( "setting mode to: " + mode );
    for ( var i = 0; i < MODES.length; i ++ )
    {
        if (MODES[i] == mode)
        {
            document.getElementById( mode + "Icon" ).style.color = SELECTED_ICON_COLOR;      
            document.getElementById('modeLabel').textContent = mode;
        }
        else
        {
            document.getElementById( MODES[i]+"Icon" ).style.color = DEFAULT_ICON_COLOR;
        }
    }
}

function setupIconElts()
{
    for ( var i = 0; i < MODES.length; i++ ) 
        document.getElementById( MODES[i]+"Icon" ).style.color = DEFAULT_ICON_COLOR;
    
    var tooltips = [].slice.call(document.querySelectorAll('.tooltip'))

    tooltips.forEach(function(tooltip) {
    var tooltipSpan = tooltip.querySelector('.tooltip-content');

    tooltip.onmousemove = function(e) {
        var x = e.clientX,
            y = e.clientY;
        tooltipSpan.style.top = (y + 10) + 'px';
        tooltipSpan.style.left = (x + 20) + 'px';
    }
    });
}

function clickIcon(anchor) {
    var clickedIconId = anchor.querySelector("i").id;

    // id has "Icon" at the end, so strip off last 4 characters
    setMode( clickedIconId.substring( 0, clickedIconId.length - 4 ) );
}

function clearFramework() {
    clearBarAndJoint();
    setMode( DEFAULT_MODE );
}

function outputFramework() {
    var jsonString = frameworkToJSON();
    document.getElementById('jsonArea').textContent = jsonString;
    console.log( jsonString );
}

function inputFramework() {
    jsonText = document.getElementById('jsonArea').textContent;
    console.log( jsonText );

    if ( jsonText === "" )
        clearFramework();
    else
        addBarAndJointToWorldFromJSON( jsonText );
}

function loadFile() {
    console.log( "in loadFile" );
    const content = document.querySelector('.content');
    const [file] = document.querySelector('input[type=file]').files;
    const reader = new FileReader();

    reader.addEventListener("load", () => {
        // this will then display a text file
        console.log(reader.result);
        document.getElementById('jsonArea').textContent = reader.result;
        addBarAndJointToWorldFromJSON( reader.result );
    }, false);

    if (file) {
    reader.readAsText(file);
    }
} 