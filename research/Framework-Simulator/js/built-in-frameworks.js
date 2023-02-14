var builtInFrameworks = new Map();
const requestURLBase = "http://minerva.cs.mtholyoke.edu/research/Framework-Simulator/json/";
var BUILT_IN_FILES = new Map([
    ["Triangle", "triangle"],
    ["Four bar", "fourBar"],
    ["Desargues (special position)", "specialDesargues"]
    ]);

var labelToGraphObj = new Map();

function initFramework()
{

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const frameworkName = urlParams.get('framework');

    console.log(frameworkName);

    if ( typeof frameworkName === "undefined" )
    {
        console.log( "no framework");
        loadTriangle();
        loadFourBar( false );
    }
    else
    {
        initDefaultFramework( frameworkName );
    }

}

async function setupBuiltIns()
{
    for (let [key, value] of BUILT_IN_FILES) 
    {
        const request = new Request(requestURLBase + value + ".json");
        const response = await fetch(request);
        const jsonObj = await response.json();
    
        addBuiltInFramework( key,jsonObj);
    }
}

function addBuiltInFramework( label, jsonObj )
{
    var select = document.getElementById("Frameworks");
    var option = document.createElement('option');
    option.text = label;
    option.value = label;
    console.log( `adding built in framework ${label}`);
    select.add(option);
    console.log( `now there are ${select.length} options`);

    labelToGraphObj.set( label, jsonObj );
}

function loadBuiltIn()
{
    var select = document.getElementById("Frameworks");
    var retrievedGraph = labelToGraphObj.get( select.value  );
    console.log( `selecting from ${select.length} options`);

    addBarAndJointToWorldFromCytoscapeObj( retrievedGraph );
}

// e.g. "http://minerva.cs.mtholyoke.edu/research/Framework-Simulator/json/triangle.json"
async function initDefaultFramework( frameworkURL )
{
    const request = new Request( frameworkURL );
    const response = await fetch(request);
    const jsonObj = await response.json();
    
    // addBuiltInFramework( key,jsonObj);
    // var retrievedGraph = labelToGraphObj.get( select.value  );
    // console.log( `selecting from ${select.length} options`);

    addBarAndJointToWorldFromCytoscapeObj( jsonObj );
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
