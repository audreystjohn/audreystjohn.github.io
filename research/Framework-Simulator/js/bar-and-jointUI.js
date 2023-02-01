var mouse, mouseConstraint;
var pressedKeys = new Array();
var PINNING_KEY = "p";
var DELETION_KEY = "d";
var selectedCircle = null;
var SELECTED_STROKE_COLOR = "orange";

function initUI()
{
    // add mouse control
    mouse = Mouse.create(render.canvas);

    // keep the mouse in sync with rendering
    render.mouse = mouse;

    // this initializes the global mouseConstraint, which allows dragging
    // and lets us check if the mouse is on top of a body
    setupMouseConstraint();

    // this will be querying HTML mouse click event
    setupMouseClick();

    // this will be for checking the key that is held down
    setupKeyPressing();
}

function setupMouseClick()
{
    matterCanvas.addEventListener('click', function (e) {
        console.log( "click at " + e.offsetX + "," + e.offsetY );

        console.log( render.mouse.button  );
        console.log( mouseConstraint.body );

        // if not over a circle, add one
        if ( mouseConstraint.body == null )
        {
            console.log( "add a circle here");
            addCircle( nextID(), e.offsetX, e.offsetY );
        }
        // otherwise, there is a circle being clicked
        else
        {
            clickedCircle = mouseConstraint.body;

            // if we're pinning it
            if ( pressedKeys.includes( PINNING_KEY ) )
            {
                console.log( "pin it" );
                togglePinning( clickedCircle );
            }
            // otherwise, if we're selecting it
            else if (e.shiftKey)
            {
                console.log('shift down');
                toggleSelection( clickedCircle );
            }
            // otherwise, if we're deleting it
            else if ( pressedKeys.includes( DELETION_KEY ) )
            {
                console.log('shift down');
                deleteCircle( clickedCircle );
            }
        }        
    });
}

/** This helps with dragging and with convenience of knowing if mouse is interacting with matter bodies */
function setupMouseConstraint()
{
    mouseConstraint = MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                // allow bodies on mouse to rotate
                angularStiffness: 0,
                render: {
                    visible: false
                }
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
    // console.log( `You pressed ${keyVal}` );
    var keyVal = e.key.toLowerCase();
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