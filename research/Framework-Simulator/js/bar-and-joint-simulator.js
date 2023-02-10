// module aliases
var Engine = Matter.Engine,
    Events = Matter.Events,
    Render = CustomRender, //Matter.Render,
    Runner = Matter.Runner,
    Composites = Matter.Composites,
    Common = Matter.Common,
    Constraint = Matter.Constraint,
    MouseConstraint = Matter.MouseConstraint,
    Mouse = Matter.Mouse,
    Composite = Matter.Composite,
    Bodies = Matter.Bodies;
    Body = Matter.Body;
    Query = Matter.Query;

// CONSTRAINT CONSTANTS
var STIFFNESS_CONSTANT = .9;

// DISPLAY CONSTANTS
var CIRCLE_FILL_COLOR = "#03a9fc"; // blue
var CIRCLE_LINE_WIDTH = 2;
var CIRCLE_STROKE_COLOR = "navy";
var PINNED_CIRCLE_FILL_COLOR = "orange"; 
var CONSTRAINT_STROKE_COLOR = "#000000"; // black
var WALL_FILL_COLOR = "#856e5d"; // brown

// HTML elements
var matterCanvas;

// global variables
var engine, world, render;

// map vertex IDs -> world's circle objects
var idToCircleMap;
var barAndJointComposite;

var sandbox_width = 800; // FOR SOME REASON, any other value messes up the click coordinates
var sandbox_height = 400; // this one is cool... no matter what you put in ...

function setup()
{
    // create engine
    engine = Engine.create();

    // remove gravity
    engine.gravity.y = 0;

    world = engine.world;

    matterCanvas = document.getElementById('matterJS-canvas');

    // create renderer
    render = Render.create({
        element: document.body,
        canvas: matterCanvas,
        engine: engine,
        options: {
            width: sandbox_width,
            height: sandbox_height,
            showAngleIndicator: true,
            wireframes: false,
            background: "transparent",
            strokeStyle: "black"
        }
    });

    Render.run(render);

    // create runner
    var runner = Runner.create();
    // Runner.run(runner, engine);

    addWalls();
    initUI();

    // fit the render viewport to the scene
    Render.lookAt(render, {
        min: { x: 0, y: 0 },
        max: { x: matterCanvas.width, y: matterCanvas.height }
    });

    // run the renderer
    Render.run(render);

    // create runner
    var runner = Runner.create();

    // run the engine
    Runner.run(runner, engine);

    initDataSets();
}

function initDataSets()
{
    idToCircleMap = new Map();
    circleLabelToIDMap = new Map();
    barAndJointComposite = Composite.create({ label: 'Bar-and-joint' });
    
    Composite.add( world, [barAndJointComposite] );
}

function clearBarAndJoint()
{
    idToCircleMap.clear();
    Composite.clear(barAndJointComposite);
}

function addWalls()
{
    Composite.add(world, [
        // walls
        Bodies.rectangle(sandbox_width/2, 0, sandbox_width, 20, { isStatic: true, render:{fillStyle: WALL_FILL_COLOR } }),
        Bodies.rectangle(sandbox_width/2, sandbox_height, sandbox_width, 20, { isStatic: true, render:{fillStyle: WALL_FILL_COLOR } }),
        Bodies.rectangle(sandbox_width, sandbox_height/2, 20, sandbox_height, { isStatic: true, render:{fillStyle: WALL_FILL_COLOR } }),
        Bodies.rectangle(0, sandbox_height/2, 20, sandbox_height, { isStatic: true, render:{fillStyle: WALL_FILL_COLOR } })
    ]);
}

/**
 * Add a circle to the world using the id (which should correspond to vertex id)
 * at coordinates (x,y)
 */
function addCircle( id, x, y, pinned=false )
{
    // create the body
    var ball = Bodies.circle(x, y, 15, 
        {   
            graphID: id, // to track the id from the "graph"
            collisionFilter: { group: -1 },
            isStatic: false, // start off not pinned 
            render:{
                fillStyle: CIRCLE_FILL_COLOR,
                lineWidth: CIRCLE_LINE_WIDTH,
                strokeStyle: CIRCLE_STROKE_COLOR,
                text:{
                    content:id,
                    color:"black"
                }
            } 
        });   

    if ( pinned )
        togglePinning( ball );

    // keep track of it through the id map
    idToCircleMap.set( id, ball );

    // add the body to the world
    Composite.add( barAndJointComposite, [ball] );
}

/**
 * use the already built-in property isStatic to pin or unpin a circle
 */
function togglePinning( circleBody ) 
{
    if ( !circleBody.isStatic )
        circleBody.render.fillStyle = PINNED_CIRCLE_FILL_COLOR;
    else
        circleBody.render.fillStyle = CIRCLE_FILL_COLOR;
    circleBody.isStatic = !circleBody.isStatic;
}

/**
 * Add constraint between the two circles, using graph IDs (NOT the built-in id for the matter-js body).
 */
function addConstraintBetween( id1, id2 )
{
    var ballA = idToCircleMap.get( id1 );
    var ballB = idToCircleMap.get( id2 );

    if ( ballA && ballB )
    {
        var constraint = Constraint.create({
            bodyA: ballA,
            bodyB: ballB,
            render: {strokeStyle: CONSTRAINT_STROKE_COLOR},
            stiffness: STIFFNESS_CONSTANT
        });

        Composite.add(barAndJointComposite, [constraint]);
    }
    else 
    {
        console.log( "one or both IDs are invalid" );
        console.log( "id1: " + id1 + " mapped to " + "ballA"+ ballA );
        console.log( "id2: " + id2 + " mapped to " + "ballB"+ ballB );
    }
}

/**
 * Move the circle (respecting constraints).
 */
function moveCircle( graphID, updatedX, updatedY )
{
    // changing a body's position in Matter JS maintains the constraints
    var circleBody = idToCircleMap.get( graphID );
    Body.setPosition( circleBody, {x:updatedX, y:updatedY});
}


/**
 * Change the position of the circle and update relevant constraint values.
 */
function setPosition( graphID, updatedX, updatedY )
{
    console.log( `moving ${graphID} to ${updatedX}, ${updatedY}`);

    // changing a body's position in Matter JS maintains the constraints
    // we will remove all the constraints, move the body, then put the constraints back in
    var circleBody = idToCircleMap.get( graphID );

    // track neighbors 
    var neighbors = new Array();
    var currentConstraints = Composite.allConstraints(barAndJointComposite);
    var currentConstraint;

    // iterate over all constraints
    // if find a neighbor, remove the constraint and track the graphID to add back in
    for ( var i = 0; i < currentConstraints.length; i++ )
    {
        currentConstraint = currentConstraints[i];
        if ( currentConstraint.bodyA == circleBody )
        {
            neighbors.push( currentConstraint.bodyB.graphID );
            Composite.remove( barAndJointComposite, currentConstraint );        
        }
        else if ( currentConstraint.bodyB == circleBody )
        {
            neighbors.push( currentConstraint.bodyA.graphID );
            Composite.remove( barAndJointComposite, currentConstraint );        
        }
    }
    Body.setPosition( circleBody, {x:updatedX, y:updatedY});

    // now add the constraints back in
    for ( var i = 0; i < neighbors.length; i++ )
        addConstraintBetween( graphID, neighbors[i] );
    console.log( circleBody );
}

function deleteCircle( circleBody )
{
    var currentConstraints = Composite.allConstraints(barAndJointComposite);
    var currentConstraint;
    for ( var i = 0; i < currentConstraints.length; i++ )
    {
        currentConstraint = currentConstraints[i];
        if ( currentConstraint.bodyA == circleBody || currentConstraint.bodyB == circleBody )
            Composite.remove( barAndJointComposite, currentConstraint );        
    }
    Composite.remove( barAndJointComposite, circleBody );
}

function nextID()
{
    var graphIDs = Array.from( idToCircleMap.keys() );
    var maxLabel = maxValue( graphIDs );

    // if there are no vertices
    if ( maxLabel == null )
        return "a";
    // check if we are using numbers 
    else if (  /^\d+$/.test(maxLabel) )
        return (Number(maxLabel) + 1).toString();
    else 
    {
        var lastChar = maxLabel.charAt( maxLabel.length - 1 );
        console.log( "lastChar: " + lastChar );
        if ( lastChar.toLowerCase() === "z" )
        {
            if (maxLabel.length == 1)
                return "aa";
            else
            {
                var secondToLastChar = maxLabel.charAt( maxLabel.length - 2 );                 
                return maxLabel.substring( 0, maxLabel.length - 2 ) + nextLetterInAlphabet( secondToLastChar ) + "a";
            }
        }
        else
        {
            console.log( "in other else: " + lastChar );
            return maxLabel.substring( 0, maxLabel.length - 1 ) + nextLetterInAlphabet( lastChar );
        }
    }
}

function maxValue( arr )
{
    if ( arr.length == 0 )
        return null;
    else
    {
        var maxID = arr[0];
        for ( var i = 0; i < arr.length; i++ )
            if ( arr[i] > maxID || arr[i].length > maxID.length )
                maxID = arr[i];
        return maxID;
    }
}

function nextLetterInAlphabet(letter) {
    if (letter == "z") {
      return "a";
    } else if (letter == "Z") {
      return "A";
    } else {
      return String.fromCharCode(letter.charCodeAt(0) + 1);
    }
  }
