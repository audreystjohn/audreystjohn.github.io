function addBarAndJointToWorldFromJSON( jsonText, clearFirst = true )
{
  console.log( "in addBarAndJointToWorldFromJSON: " + jsonText);
  var graphObj = JSON.parse(jsonText);
  addBarAndJointToWorldFromCytoscapeObj( graphObj, clearFirst ); 
}

/**
 * Takes text that is formatted as cytoscape graph and uses it
 * to add a bar-and-joint framework to the stage.
 * Assumes each node has a unique "id" entry as well as "x" and "y" coodinates. 
 * For now, ignores the distance part of an edge; constraint length is determined
 * by embedded joint coordinates.
 */
function addBarAndJointToWorldFromCytoscapeObj( graphObj, clearFirst = true )
{
  console.log( "addBarAndJointToWorldFromCytoscapeObj: " + graphObj );
  if (clearFirst) 
    clearBarAndJoint();

  // iterate over the nodes and add them to the world at (x,y) coordinates
  for ( var i = 0; i < graphObj.nodes.length; i++ )
  {
    console.log( graphObj.nodes[i] );
    node = graphObj.nodes[i];
    addCircle( node.data.id, Number(node.data.x), Number(node.data.y) );
  }

  // iterate over the edges to add constraints between the (assumed to be existing)
  // joints
  for ( var i = 0; i < graphObj.edges.length; i++ )
  {
    edge = graphObj.edges[i];
    idA = edge.data.source;
    idB = edge.data.target;
    addConstraintBetween( idA, idB );    
  }
}      

/**
 * Return a JSON string of the current framework.
 */
function frameworkToJSON()
{
  var cytograph = { nodes:new Array(), edges:new Array() };

  // get the bodies -> nodes
  var bodies = Composite.allBodies( barAndJointComposite );
  for ( var i = 0; i < bodies.length; i++ )
  {
    cytograph.nodes.push( { data: { id: bodies[i].graphID,
                                     x: bodies[i].position.x,
                                     y: bodies[i].position.y } } );
  }

  // get the constraints -> edges
  var constraints = Composite.allConstraints( barAndJointComposite );
  for ( var i = 0; i < constraints.length; i++ )
  {
    cytograph.edges.push( { data: { source: constraints[i].bodyA.graphID,
                                    target: constraints[i].bodyB.graphID } } );
  }  
  return JSON.stringify( cytograph, null, 2 );
}