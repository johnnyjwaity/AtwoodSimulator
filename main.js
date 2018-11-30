var objects = [];
var connections = [];
var engine;
var usePhysics = false;
var lastTime = 0;
var startHeight = 55;

function animate(timeRan) {
  var canvas = document.getElementById("window");
  var ctx = canvas.getContext("2d");

  //Remove Everything From Screen
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  //Draw all objects from their vertices onto the canvas
  drawObjects(ctx);

  var deltaTime = timeRan - lastTime;
  lastTime = timeRan;

  //This will be true once run is pressed
  if (usePhysics) {
    for(c = 0; c < connections.length; c++){
      drawTangentalLine(connections[c].obj1, connections[c].pulley, connections[c])
      drawTangentalLine(connections[c].obj2, connections[c].pulley, connections[c])
    }


    //Get all bodies from the Matter World
    var bodies = Matter.Composite.allBodies(engine.world);
    //Clear Objects
    objects = [];
    for (i = 0; i < bodies.length; i++) {
      //Remake All Objects from the Matter World bodies (So they will be updated with pysics)
      Matter.Body.applyForce(
        bodies[i],
        Matter.Vertices.centre(bodies[i].vertices),
        createVertex(0, 0.00098 * bodies[i].mass)
      );
      for (c = 0; c < connections.length; c++) {
        var connection = connections[c]
        if(connection.obj1 == i || connection.obj2 == i){
          var objToApply = connection.obj1
          var tanPoint = connection.obj1Tan
          if(i == connection.obj1){
            objToApply = connection.obj2
            tanPoint = connection.obj2Tan
          }
          var force = bodies[i].force;
          console.log(force.y)
          force = Math.sqrt(Math.pow(force.x, 2) + Math.pow(force.y, 2)); 
          //reverse force!!!!!!!!!!!!!!!
          Matter.Body.applyForce(bodies[objToApply], Matter.Vertices.centre(bodies[objToApply].vertices), createVertex(Math.cos(Math.PI / 2) * force, Math.sin(Math.PI / 2) * force))
        }
      }

      // console.log({
      //   V: (bodies[i].velocity.y * 10) / 16.7,
      //   t: timeRan,
      //   y: Matter.Vertices.centre(bodies[i].vertices).y
      // });
      objects.push(createObject(bodies[i].vertices));
    }
    for (i = 0; i < bodies.length; i++) {
      if (!bodies[i].isStatic && bodies[i].force.y > 0) {
        // console.log(bodies[i].force.y);
        // console.log({ force: bodies[i].force, mass: bodies[i].mass });
      }
    }
    

    //Make Engine Move Foward By Delta Time
    Matter.Engine.update(engine, deltaTime);
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

function drawTangentalLine(obj, pulley, connection){
  var ctx = document.getElementById('window').getContext('2d')

  var pulleyCenter = Matter.Vertices.centre(
    objects[pulley].vertices
  );
  // console.log("pulley center: " + pulleyCenter);
  var pulleyRadius = 50;
  var objCenter = Matter.Vertices.centre(
    objects[obj].vertices
  );
  var distance = vertexDistance(pulleyCenter, objCenter);
  var midPoint = createVertex(
    (pulleyCenter.x + objCenter.x) / 2,
    (pulleyCenter.y + objCenter.y) / 2
  );
  var tangents = intersection(
    pulleyCenter.x,
    pulleyCenter.y,
    pulleyRadius,
    midPoint.x,
    midPoint.y,
    distance / 2
  );
  if (tangents != false) {
    var startIndex = 0;
    var endIndex = 1;
    if (tangents[3] < tangents[1]) {
      startIndex = 1;
      endIndex = 2;
    }
    for (i = startIndex; i < endIndex; i++) {
      if(connection.obj1 == obj){
        connection.obj1Tan = createVertex(tangents[i * 2], tangents[1 + i * 2])
      }else{
        connection.obj2Tan = createVertex(tangents[i * 2], tangents[1 + i * 2])
      }
      ctx.strokeStyle = "#FF0000";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(objCenter.x, objCenter.y);
      ctx.lineTo(tangents[i * 2], tangents[1 + i * 2]);
      ctx.stroke();
    }
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

function createPolygon(x1, x2, x3, x4, y1, y2, y3, y4) {
  //UP TO 4 SIDES
  var polygon = {};
  polygon.vertices = [
    createVertex(x1, y1),
    createVertex(x3, y3),
    createVertex(x4, y4),
    createVertex(x2, y2)
  ];
  return polygon;
}
function createCircle(radius) {
  var circle = Matter.Bodies.circle(50, 50, radius);
  objects.push(createObject(circle.vertices));
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
  return { vertices: vertices, rotation: 0 };
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
  e.world.gravity.y = 0; //0.98;
  for (i = 0; i < objects.length; i++) {
    //Create a physics body from the vertices
    if (i < 3 || i == 5) {
      //makes ramp and floor static --- FOR PURPOSE OF PROTOTYPE: CLICK ON CREATE RAMP AND CREATE FLOOR FIRST, OR ELSE THE FLOOR AND RAMP WILL MOVE
      var obj = Matter.Body.create({
        position: Matter.Vertices.centre(objects[i].vertices),
        vertices: objects[i].vertices,
        frictionAir: 0,
        friction: 1,
        restitution: 0,
        isStatic: true,
        velocity: { x: 0, y: 0 }
      });
      //		Matter.Body.setVelocity(obj, createVertex(0, 0));
      //		Matter.Body.setMass(obj, 1);
      Matter.Body.applyForce(
        obj,
        { x: obj.position.x, y: obj.position.y },
        { x: 0, y: 0 }
      ); //control amount of force applied
      console.log(obj.position);
      //Add these bodies to the world
      Matter.World.add(e.world, [obj]);
    } else {
      var obj = Matter.Body.create({
        position: Matter.Vertices.centre(objects[i].vertices),
        vertices: objects[i].vertices,
        frictionAir: 0,
        friction: 0.05,
        restitution: 0,
        mass: 1,
        isStatic: false,
        velocity: { x: 0, y: 0 }
      });
      if (i == 3) {
        Matter.Body.setMass(obj, 2);
      }

      // Matter.Body.setMass(obj, 100);
      //		Matter.Body.setVelocity(obj, createVertex(0, 0));
      //		Matter.Body.setMass(obj, 1);
      // Matter.Body.applyForce(
      //   obj,
      //   { x: obj.position.x, y: obj.position.y },
      //   { x: 0, y: 0.098 }
      // ); //control amount of force applied

      console.log(obj.position);
      //Add these bodies to the world
      Matter.World.add(e.world, [obj]);
    }
  }
  //Sets engine and usePhysics so teh canvas will now update woth physics changes
  engine = e;
  usePhysics = true;

  //Create a Renderer. The Canvas is the main renderer this renderer is being used for debugging purposes and will be removed before final release
  // var render = Matter.Render.create({
  //   element: document.getElementById("matter-window"),
  //   engine: engine,
  //   options: {
  //     showAngleIndicator: true
  //   }
  // });
  //Run the Engine and the Renderer
  // Matter.Render.run(render);
  // Matter.Engine.run(engine);
  var bodies = Matter.Composite.allBodies(engine.world);
  for (i = 0; i < bodies.length; i++) {
    Matter.Body.setVelocity(bodies[i], createVertex(0, 0));
  }

  connections.push(createConnection(objects.length - 3, objects.length - 2, objects.length - 1))
}
function createConnection(obj1, obj2, pulley){
  var c = {
    obj1: obj1,
    obj2: obj2,
    pulley: pulley,
    obj1Tan: null,
    obj2Tan: null
  }
  return c
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

      rotate(dragIndex);
    }
    //update last psoition
    lastPosition = createVertex(e.pageX, e.pageY);
  }
});
document.getElementById("window").addEventListener("mouseup", function(e) {
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

function rotate(index) {
  if (objects[index].vertices.length == 4) {
    var closestRampIndex = -1;
    var distance = -1;
    for (i = 0; i < objects.length; i++) {
      if (objects[i].vertices.length == 3) {
        if (closestRampIndex == -1) {
          closestRampIndex = i;
          distance = objDistance(objects[index], objects[i]);
        } else {
          var d2 = objDistance(objects[index], objects[i]);
          if (d2 < distance) {
            closestRampIndex = i;
            distance = d2;
          }
        }
      }
    }
    if (distance != -1 && distance < 100) {
      var closestVertices = [];
      var vertexDistances = [];
      var objCenter = Matter.Vertices.centre(objects[index].vertices);
      for (i = 0; i < 3; i++) {
        vertexDistances.push(
          vertexDistance(objCenter, objects[closestRampIndex].vertices[i])
        );
        closestVertices.push(objects[closestRampIndex].vertices[i]);
      }
      var largestVertex = vertexDistances.indexOf(Math.max(vertexDistances));
      closestVertices.splice(largestVertex);
      var rotateAmount = Math.atan(
        (closestVertices[1].y - closestVertices[0].y) /
          (closestVertices[1].x - closestVertices[0].x)
      );
      rotateVertices(objects[index], -1 * objects[index].rotation);
      rotateVertices(objects[index], rotateAmount);
      objects[index].rotation = rotateAmount;
    } else {
      rotateVertices(objects[index], -1 * objects[index].rotation);
      objects[index].rotation = 0;
    }
  }
}
function rotateVertices(obj, angle) {
  var center = Matter.Vertices.centre(obj.vertices);
  for (i = 0; i < obj.vertices.length; i++) {
    var cv = obj.vertices[i];
    obj.vertices[i] = createVertex(
      (cv.x - center.x) * Math.cos(angle) -
        (cv.y - center.y) * Math.sin(angle) +
        center.x,
      (cv.x - center.x) * Math.sin(angle) +
        (cv.y - center.y) * Math.cos(angle) +
        center.y
    );
  }
}

function objDistance(obj1, obj2) {
  var center1 = Matter.Vertices.centre(obj1.vertices);
  var center2 = Matter.Vertices.centre(obj2.vertices);
  return vertexDistance(center1, center2);
}
function vertexDistance(v1, v2) {
  return Math.sqrt(Math.pow(v2.x - v1.x, 2) + Math.pow(v2.y - v1.y, 2));
}

//End Drag

window.addEventListener(
  "message",
  function(e) {
    if (e.data == "close") {
      closeTriangleBuilder();
    } else {
      var obj = createObject(e.data);
      objects.push(obj);
    }
  },
  false
);

function openTriangleBuilder() {
  var frame = document.createElement("IFRAME");
  frame.id = "triangleBuilder";
  frame.frameBorder = 0;
  frame.src = "triangle.html";
  document.body.appendChild(frame);
}
function closeTriangleBuilder() {
  var frame = document.getElementById("triangleBuilder");
  if (frame != null) {
    document.body.removeChild(frame);
  }
}
function intersection(x0, y0, r0, x1, y1, r1) {
  var a, dx, dy, d, h, rx, ry;
  var x2, y2;

  /* dx and dy are the vertical and horizontal distances between
   * the circle centers.
   */
  dx = x1 - x0;
  dy = y1 - y0;

  /* Determine the straight-line distance between the centers. */
  d = Math.sqrt(dy * dy + dx * dx);

  /* Check for solvability. */
  if (d > r0 + r1) {
    /* no solution. circles do not intersect. */
    return false;
  }
  if (d < Math.abs(r0 - r1)) {
    /* no solution. one circle is contained in the other */
    return false;
  }

  /* 'point 2' is the point where the line through the circle
   * intersection points crosses the line between the circle
   * centers.
   */

  /* Determine the distance from point 0 to point 2. */
  a = (r0 * r0 - r1 * r1 + d * d) / (2.0 * d);

  /* Determine the coordinates of point 2. */
  x2 = x0 + (dx * a) / d;
  y2 = y0 + (dy * a) / d;

  /* Determine the distance from point 2 to either of the
   * intersection points.
   */
  h = Math.sqrt(r0 * r0 - a * a);

  /* Now determine the offsets of the intersection points from
   * point 2.
   */
  rx = -dy * (h / d);
  ry = dx * (h / d);

  /* Determine the absolute intersection points. */
  var xi = x2 + rx;
  var xi_prime = x2 - rx;
  var yi = y2 + ry;
  var yi_prime = y2 - ry;

  return [xi, yi, xi_prime, yi_prime];
}
