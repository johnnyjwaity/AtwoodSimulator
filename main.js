var objects = [];
var engine;
var usePhysics = false;
var lastTime = 0;

function animate(timeRan) {
  var canvas = document.getElementById("window");
  var ctx = canvas.getContext("2d");

  //Remove Everything From Screen
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  //Draw all objects from their vertices onto the canvas
  drawObjects(ctx);

  //This will be true once run is pressed
  if (usePhysics) {
    //Get all bodies from the Matter World
    var bodies = Matter.Composite.allBodies(engine.world);
    //Clear Objects
    objects = [];
    for (i = 0; i < bodies.length; i++) {
      //Remake All Objects from the Matter World bodies (So they will be updated with pysics)
      objects.push(createObject(bodies[i].vertices));
    }
  }
  //Run the Animate Function again to make it recursive
  requestAnimationFrame(animate);
}
//Initial Animate Start
animate();

/*
  This method will take all the objects from the objects 
  array and draw them onto the canvas using their vertices

  @params
  ctx - context for the canvas to draw on
*/
function drawObjects(ctx) {
  ctx.fillStyle = "000000";
  for (i = 0; i < objects.length; i++) {
    ctx.beginPath();
    //Move to first Vertex
    ctx.moveTo(objects[i].vertices[0].x, objects[i].vertices[0].y);
    //This starts at index 1 becuase the first line should be going to the second vertex
    for (v = 1; v < objects[i].vertices.length; v++) {
      ctx.lineTo(objects[i].vertices[v].x, objects[i].vertices[v].y);
    }
    //Draw line back to the first
    ctx.lineTo(objects[i].vertices[0].x, objects[i].vertices[0].y);
    //Fill in the shape with color
    ctx.fill();
  }
}

/*
  This method Takes in customary rectangle constraints and
  converts them into vertices to be used for drawing and Physics

  @params
  x - left corrdinate of rectangle
  y - top coordinate of rectangle
  w - width of rectangle
  h - height of rectangle

  @return
  A body that contains vertices for the rectangle
*/
function createRect(x, y, w, h) {
  var vertices = [
    createVertex(x, y),
    createVertex(x + w, y),
    createVertex(x + w, y + h),
    createVertex(x, y + h)
  ];
  return createObject(vertices);
}

/*
  Creates A JS Object from the verticies. This object will
  be used in order for the canvas to render the object and
  for the physics engine to make it a body

  @params
  vertices - Array of Vertex. The Vertex Object needs to have an x and y property (Please use createVertex method to make one)

  @return
  An object that contains array of vertices
*/
function createObject(vertices) {
  return { vertices: vertices };
}

/*
  Creates a vertex object from a coordinate

  @params
  x - x coordinate of vertex
  y - y coordinate of vertex

  @return
  Object that contains the x and y
*/
function createVertex(x, y) {
  return { x: x, y: y };
}

/*
  This turns the canvas objects into bodies and starts
  the physics engine to simulate them
*/
function runSim() {
  //Create a new Physics Engine
  var e = Matter.Engine.create();
  for (i = 0; i < objects.length; i++) {
    //Create a physics body from the vertices
    var obj = Matter.Body.create({
      position: Matter.Vertices.centre(objects[i].vertices),
      vertices: objects[i].vertices
    });
    console.log(obj.position);
    //Add these bodies to the world
    Matter.World.add(e.world, [obj]);
  }
  //Sets engine and usePhysics so teh canvas will now update woth physics changes
  engine = e;
  usePhysics = true;

  //Create a Renderer. The Canvas is the main renderer this renderer is being used for debugging purposes and will be removed before final release
  var render = Matter.Render.create({
    element: document.getElementById("matter-window"),
    engine: engine
  });
  //Run the Engine and the Renderer
  Matter.Render.run(render);
  Matter.Engine.run(engine);
}

//Start Drag
var isDragging = false;
var lastPosition;
var dragIndex = -1;

document.getElementById("window").addEventListener("mousedown", function(e) {
  //Start dragging
  isDragging = true;
  lastPosition = createVertex(e.pageX, e.pageY);
  //Find point on canvas from mouse cursor
  var canvasPoint = translatePointOnCanvas(lastPosition);
  for (i = 0; i < objects.length; i++) {
    //Check if pointer was inside an object when clicked.
    if (Matter.Vertices.contains(objects[i].vertices, canvasPoint)) {
      //Set whicj object will be being dragged
      dragIndex = i;
      break;
    }
  }
});
document.getElementById("window").addEventListener("mousemove", function(e) {
  console.log("move");
  //Check if the mouse was down
  if (isDragging) {
    //Find change in x and y
    var deltaX = e.pageX - lastPosition.x;
    var deltaY = e.pageY - lastPosition.y;
    if (dragIndex != -1) {
      //Update vertices of objects to simulate a drag
      for (i = 0; i < objects[dragIndex].vertices.length; i++) {
        objects[dragIndex].vertices[i].x += deltaX;
        objects[dragIndex].vertices[i].y += deltaY;
      }
    }
    //update last psoition
    lastPosition = createVertex(e.pageX, e.pageY);
  }
});
document.getElementById("window").addEventListener("mouseup", function(e) {
  console.log("up");
  //Stop dragging
  isDragging = false;
  //Make no object be selected
  dragIndex = -1;
});

/*
  Takes screen coordinates and translates them to canvas coordinates

  @params
  vertex - screen coordinate to be translated

  @return
  A vertex object that contains the canvas coordinates
*/
function translatePointOnCanvas(vertex) {
  //Canvas X coordinte
  var canvasX =
    window.scrollX +
    document.getElementById("window").getBoundingClientRect().left;
  //Canvas Y Coordinte
  var canvasY =
    window.scrollY +
    document.getElementById("window").getBoundingClientRect().top;
  //Find difference in coodinates
  return createVertex(vertex.x - canvasX, vertex.y - canvasY);
}

//End Drag
