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
            width: 800,
            height: 600,
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
        max: { x: 800, y: 600 }
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
        Bodies.rectangle(400, 0, 800, 20, { isStatic: true, render:{fillStyle: WALL_FILL_COLOR } }),
        Bodies.rectangle(400, 600, 800, 20, { isStatic: true, render:{fillStyle: WALL_FILL_COLOR } }),
        Bodies.rectangle(800, 300, 20, 600, { isStatic: true, render:{fillStyle: WALL_FILL_COLOR } }),
        Bodies.rectangle(0, 300, 20, 600, { isStatic: true, render:{fillStyle: WALL_FILL_COLOR } })
    ]);
}

/**
 * Add a circle to the world using the id (which should correspond to vertex id)
 * at coordinates (x,y)
 */
function addCircle( id, x, y )
{
    // create the body
    var ball = Bodies.circle(x, y, 15, 
        {   
            graphID: id, // to track the id from the "graph"
            collisionFilter: { group: -1 },
            isStatic: false, // not pinned
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

    // keep track of it through the id map
    idToCircleMap.set( id, ball );

    // add the body to the world
    // Composite.add(world, [ball]);
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

function deleteCircle( circleBody )
{
    var currentConstraints = Composite.allConstraints(barAndJointComposite);
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
    // assume we started labeling vertices with "a" or "1"
    // next value will be 1 more than current number of elements
    currentNumberOfJoints = idToCircleMap.size;

    var firstLabel = idToCircleMap.entries().next().value[0];
    console.log( "firstLabel: " + firstLabel );
    // check if we are using numbers 
    if (  /^\d+$/.test(firstLabel) )
        return (currentNumberOfJoints + 1).toString();
    else 
        // TO DO - figure out biggest label and update if we go past Z
        return nextLetterInAlphabet( firstLabel );
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



/******* BUILT IN FRAMEWORKS  **********/

function loadTriangle( clearWorld = true )
{
    var triangleJSON = '{ "nodes": [ { "data": { "id": "1", "x": "100", "y": "100" } }, { "data": { "id": "2", "x": "200", "y": "100" } }, { "data": { "id": "3", "x": "150", "y": "150" } } ], "edges": [ {   "data": { "source": "1", "target": "2"   } }, {   "data": { "source": "2", "target": "3"   } }, {   "data": { "source": "3", "target": "1"   } }] }';
    addBarAndJointToWorldFromJSON( triangleJSON );
}

function loadFourBar( clearWorld = true )
{
    var fourbarJSON = '{"nodes": [{   "data": {  "id": "a",  "x": "400",  "y": "100"   }},{   "data": {  "id": "b",  "x": "500",  "y": "100"   }},{   "data": {  "id": "c",  "x": "550",  "y": "150"   }},{   "data": {  "id": "d",  "x": "500",  "y": "150"   }}],"edges": [{  "data": {"source": "a","target": "b"  }},{  "data": {"source": "b","target": "c"  }},{  "data": {"source": "c","target": "d"  }},{  "data": {"source": "d","target": "a"  }}] }';
    addBarAndJointToWorldFromJSON( fourbarJSON, clearWorld );
}
