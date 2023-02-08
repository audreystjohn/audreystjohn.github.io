
function setConstraintLengths( lengthValue )
{
    var currentConstraints = Composite.allConstraints(barAndJointComposite);
    var currentConstraint;

    // iterate over all constraints
    // if find a neighbor, remove the constraint and track the graphID to add back in
    for ( var i = 0; i < currentConstraints.length; i++ )
    {
        currentConstraint = currentConstraints[i];
        currentConstraint.length = lengthValue;
    }
}