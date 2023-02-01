
function loadFile() {
    const content = document.querySelector('.content');
    const [file] = document.querySelector('input[type=file]').files;
    const reader = new FileReader();

    reader.addEventListener("load", () => {
        // this will then display a text file
        console.log(reader.result);
        addBarAndJointToWorldFromJSON(reader.result);
    }, false);

    if (file) {
        reader.readAsText(file);
    }
}

/**
 * Takes text that is formatted as cytoscape graph JSON and uses it
 * to add a bar-and-joint framework to the stage.
 * Assumes each node has a unique "id" entry as well as "x" and "y" coodinates. 
 * For now, ignores the distance part of an edge; constraint length is determined
 * by embedded joint coordinates.
 */
function addBarAndJointToWorldFromJSON( jsonText, clearFirst = true )
{
  if (clearFirst) 
    clearBarAndJoint();
  var cytograph = JSON.parse(jsonText);

  // iterate over the nodes and add them to the world at (x,y) coordinates
  for ( var i = 0; i < cytograph.nodes.length; i++ )
  {
    console.log( cytograph.nodes[i] );
    node = cytograph.nodes[i];
    addCircle( node.data.id, Number(node.data.x), Number(node.data.y) );
  }

  // iterate over the edges to add constraints between the (assumed to be existing)
  // joints
  for ( var i = 0; i < cytograph.edges.length; i++ )
  {
    edge = cytograph.edges[i];
    idA = edge.data.source;
    idB = edge.data.target;
    addConstraintBetween( idA, idB );    
  }
}      

  