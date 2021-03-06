var spring = 50.0;
var damper = 5.0;
var drag = 90.0;
var angularDrag = 5.0;
var distance = 0.2;
var attachToCenterOfMass = false;
var player : GameObject;
var puckIsInMotion = false;
var playerIsSleeping = true;

private var springJoint : SpringJoint;

function OnMouseUp () {

	// determine if the puck has been thrown or not
	if(playerIsSleeping == false )
		puckIsInMotion = true;
}

function Update ()
{
	// Make sure the mouse button is down 
	var mouseIsDown = Input.GetMouseButtonDown (0);
	var velocity = player.rigidbody.velocity.magnitude;
	
	playerIsSleeping = player.rigidbody.IsSleeping();
	
	// dont proceed if the mouse is not down
	if (mouseIsDown == false)
		return;
	
	// the game cant be in motion if the puck is sleeping
	if(playerIsSleeping)
		puckIsInMotion = false;
		
	// player cant touch the puck if they have thrown it
	if(puckIsInMotion)
		return;

	var mainCamera = FindCamera();
		
	// We need to actually hit an object
	var hit : RaycastHit;
	if (!Physics.Raycast(mainCamera.ScreenPointToRay(Input.mousePosition),  hit, 100))
		return;
	// We need to hit a rigidbody that is not kinematic
	if (!hit.rigidbody || hit.rigidbody.isKinematic)
		return;
	
	if (!springJoint)
	{
		var go = new GameObject("Rigidbody dragger");
		var body : Rigidbody = go.AddComponent ("Rigidbody") as Rigidbody;
		springJoint = go.AddComponent ("SpringJoint");
		body.isKinematic = true;
	}
	
	springJoint.transform.position = hit.point;
	if (attachToCenterOfMass)
	{
		var anchor = transform.TransformDirection(hit.rigidbody.centerOfMass) + hit.rigidbody.transform.position;
		anchor = springJoint.transform.InverseTransformPoint(anchor);
		springJoint.anchor = anchor;
	}
	else
	{
		springJoint.anchor = Vector3.zero;
	}
	
	springJoint.spring = spring;
	springJoint.damper = damper;
	springJoint.maxDistance = distance;
	springJoint.connectedBody = hit.rigidbody;
	
	StartCoroutine ("DragObject", hit.distance);
}

function DragObject (distance : float)
{
	var oldDrag = springJoint.connectedBody.drag;
	var oldAngularDrag = springJoint.connectedBody.angularDrag;
	springJoint.connectedBody.drag = drag;
	springJoint.connectedBody.angularDrag = angularDrag;
	var mainCamera = FindCamera();
	
	// because this is a while loop, we need to make sure that once the player has released the puck
	// the loop is properly exited by force to prevent correctons mid flight.
	while (Input.GetMouseButton (0) && !puckIsInMotion)
	{
		var ray = mainCamera.ScreenPointToRay (Input.mousePosition);
		springJoint.transform.position = ray.GetPoint(distance);
		yield;
	}
	
	if (springJoint.connectedBody)
	{
		springJoint.connectedBody.drag = oldDrag;
		springJoint.connectedBody.angularDrag = oldAngularDrag;
		springJoint.connectedBody = null;
	}
}

function FindCamera ()
{
	if (camera)
		return camera;
	else
		return Camera.main;
}