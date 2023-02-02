var mouse, mouseConstraint;
var MOUSE_STIFFNESS = .005; // how "hard" the mouse pulls on the vertex
var pressedKeys = new Array();
var PINNING_KEY = "p";
var DELETION_KEY = "d";
var CONNECTION_KEY = "shift";
var ADDITION_KEY = "a";
var SELECTED_STROKE_COLOR = "orange";

var DEFAULT_ICON_COLOR = "gray";
var SELECTED_ICON_COLOR = "green";

var PIN_MODE = "pin";
var MOVE_MODE = "move";
var CONNECT_MODE = "connect";
var CLEAR_MODE = "clear";
var DELETE_MODE = "delete";
var ADD_MODE = "add";
var MODES = [MOVE_MODE,PIN_MODE,CONNECT_MODE,ADD_MODE,DELETE_MODE];
var DEFAULT_MODE = MOVE_MODE;

var selectedCircle = null;
var currentMode;
var previousMode;

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

    setupBuiltIns();
}

function setupCustomCanvasEvents()
{
    matterCanvas.addEventListener('click', function (e) {
        customRespondToCanvas(e.offsetX, e.offsetY);
    });
    matterCanvas.addEventListener('touchstart', function (e) {
        var touch = e.touches[0];
        var canvas = document.getElementById( 'matterJS-canvas' );
        var x = touch.pageX - canvas.offsetLeft;
        var y = touch.pageY - canvas.offsetTop;
        customRespondToCanvas(x,y);
    });
}

function customRespondToCanvas( x, y )
{
    var bodiesUnder  = Query.point( Composite.allBodies(barAndJointComposite), { x: x, y: y});

    // console.log( "body under (" + x + "," + y + "): " + bodiesUnder[0].graphID );

    // if in ADD_MODE, add one
    if ( currentMode === ADD_MODE )
    {
        // console.log( "add a circle here");
        addCircle( nextID(), x, y );
    }
    // otherwise, there is a circle being clicked
    else if ( bodiesUnder.length > 0 )
    {
        // clickedCircle = mouseConstraint.body;
        var clickedCircle = bodiesUnder[0];

        // if we're pinning it
        if ( currentMode === PIN_MODE )
        {
            // console.log( "pin it" );
            togglePinning( clickedCircle );
        }
        // otherwise, if we're selecting it
        else if ( currentMode === CONNECT_MODE )
        {
            // console.log('shift down');
            toggleSelection( clickedCircle );
        }
        // otherwise, if we're deleting it
        else if ( currentMode === DELETE_MODE )
        {
            // console.log('shift down');
            deleteCircle( clickedCircle );
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
    if ( keyVal === PINNING_KEY )
        setMode( PIN_MODE );
    else if ( keyVal === DELETION_KEY )
        setMode( DELETE_MODE );
    else if ( keyVal === CONNECTION_KEY )
        setMode( CONNECT_MODE );
    else if ( keyVal === ADDITION_KEY )
        setMode( ADD_MODE );
    
    if ( !pressedKeys.includes( keyVal ) )
        pressedKeys.push( keyVal );
    // console.log( pressedKeys );
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
//    console.log( pressedKeys );
}

function toggleSelection( circleBody ) 
{
    // if already selected
    if ( selectedCircle == circleBody )
    {
        // we want to unselect it
        selectedCircle = null;

        resetStyle( selectedCircle );
    }
    // otherwise
    {
        // if this is the first one clicked
        if ( selectedCircle == null )
        {
            // select it
            selectedCircle = circleBody;

            // update its render property
            selectedCircle.render.lineWidth *= 2;
            selectedCircle.render.strokeStyle = SELECTED_STROKE_COLOR;
        }
        // otherwise, it's the second one clicked
        else
        {
            // add the constraint
            addConstraintBetween( selectedCircle.graphID, circleBody.graphID );

            // reset for the next time
            resetStyle( selectedCircle );
            selectedCircle = null;
        }
    }

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
        //   addBarAndJointToWorldFromJSON( reader.result );
      }, false);
  
      if (file) {
        reader.readAsText(file);
      }
  } 