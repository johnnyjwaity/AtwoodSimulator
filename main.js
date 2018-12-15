var objects = [];
var connections = [];
var engine;
var usePhysics = false;
var lastTime = 0;
var startHeight = 55;
var abovePulley = false;
var previousPos = -1;
const propertyTypes = { mass: "number", isStatic: "checkbox" };
var units = {mass: "kg", acceleration: "m/s/s", velocity: "m/s"}
var selectedObject;
var lines = [];
var colors = [];
var simDrawn = false;

function animate(timeRan) {
  var canvas = document.getElementById("window");
  var ctx = canvas.getContext("2d");

  //Remove Everything From Screen
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  //Draw all objects from their vertices onto the canvas
  drawObjects(ctx);

  for (l = 0; l < lines.length; l++) {
    ctx.beginPath();
    ctx.moveTo(lines[l].start.x, lines[l].start.y);
    ctx.lineTo(lines[l].end.x, lines[l].end.y);
    ctx.stroke();
  }

  var deltaTime = timeRan - lastTime;
  lastTime = timeRan;

  //This will be true once run is pressed
  if (usePhysics) {
    for (c = 0; c < connections.length; c++) {
      drawTangentalLine(
        connections[c].obj1,
        connections[c].pulley,
        connections[c]
      );
      drawTangentalLine(
        connections[c].obj2,
        connections[c].pulley,
        connections[c]
      );
    }
    //Get all bodies from the Matter World
    var bodies = Matter.Composite.allBodies(engine.world);
    //Clear Objects
    // objects = [];
    for (i = 0; i < bodies.length; i++) {
      //Remake All Objects from the Matter World bodies (So they will be updated with pysics)
      previousPos = bodies[i].position.y;
      if (abovePulley != true) {
        // Matter.Body.applyForce(
        //   bodies[i],
        //   Matter.Vertices.centre(bodies[i].vertices),
        //   createVertex(0, 0.00098 * bodies[i].mass)
        // );
      }
      // console.log("Previous Pos: " + previousPos);
      for (c = 0; c < connections.length; c++) {
        var connection = connections[c];
        if (connection.obj1 == i || connection.obj2 == i) {
          var objToApply = connection.obj1;
          var tanPoint = connection.obj1Tan;
          if (i == connection.obj1) {
            objToApply = connection.obj2;
            tanPoint = connection.obj2Tan;
          }
          var tensionAngle = -Math.atan2(
            -bodies[objToApply].position.y + tanPoint.y,
            -bodies[objToApply].position.x + tanPoint.x
          );
          var tension = calculateTension(connection, bodies);

          if (
            connection.ropeLength == NaN ||
            connection.ropeLength == undefined
          ) {
            connection.ropeLength = calcualteRopeLength(connection, bodies);
          }

          var ropeDifference = Math.abs(
            connection.ropeLength - calcualteRopeLength(connection, bodies)
          );
          // objects[objToApply].properties.mass += 1
          tension = calculateTension1(
            connection,
            bodies[connection.obj1],
            bodies[connection.obj2]
          );
          objects[objToApply].properties.acceleration = Math.round(tension * 1000000) / 100
          var velocity = createVertex(bodies[objToApply].velocity.x, bodies[objToApply].velocity.y).magnitude()
          objects[objToApply].properties.velocity = Math.round(velocity * 100) / 100
          tension *= bodies[objToApply].mass;


          var otherBody;
          var otherTanPoint
          var tanPoint;
          if (connection.obj1 != objToApply) {
            otherBody = bodies[connection.obj1];
            otherTanPoint = connection.obj1Tan
            tanPoint = connection.obj2Tan
          } else {
            otherBody = bodies[connection.obj2];
            otherTanPoint = connection.obj2Tan
            tanPoint = connection.obj1Tan
          }

          // if (otherMass > bodies[objToApply].mass) {
          //   tension *= -1;
          // }

          var aDirection = createVertex(tanPoint.x - bodies[objToApply].position.x, tanPoint.y - bodies[objToApply].position.y)
          var mag = aDirection.magnitude()
          aDirection.x /= mag
          aDirection.y /= mag
          aDirection.x *= tension
          aDirection.y *= tension

          var weight = bodies[objToApply].mass * 0.00098 * Math.sin(Math.atan((bodies[objToApply].position.y - tanPoint.y) / (bodies[objToApply].position.x - tanPoint.x)));
          var otherWeight = otherBody.mass * 0.00098 * Math.sin(Math.atan((otherBody.position.y - otherTanPoint.y) / (otherBody.position.x - otherTanPoint.x)));
          console.log("Weight: " + weight + " Other Weight: " + otherWeight + " Acceleration: " + tension)
          console.log(otherWeight)

          if(Math.abs(weight) > Math.abs(otherWeight)){
            aDirection.x *= -1
            aDirection.y *= -1
          }
          // console.log(calcualteRopeLength(connection, bodies));
          Matter.Body.applyForce(
            bodies[objToApply],
            Matter.Vertices.centre(bodies[objToApply].vertices),
            aDirection
          );
          // if (ropeDifference < 1) {

          // } else if (
          //   calcualteRopeLength(connection, bodies) > connection.ropeLength
          // ) {
          //   Matter.Body.applyForce(
          //     bodies[objToApply],
          //     Matter.Vertices.centre(bodies[objToApply].vertices),
          //     createVertex(0, -0.00098 * bodies[objToApply].mass)
          //   );
          //   Matter.Body.setVelocity(bodies[objToApply], createVertex(0, 0));
          // } else if (
          //   calcualteRopeLength(connection, bodies) < connection.ropeLength
          // ) {
          //   Matter.Body.applyForce(
          //     bodies[objToApply],
          //     Matter.Vertices.centre(bodies[objToApply].vertices),
          //     createVertex(0, 0.00098 * bodies[objToApply].mass)
          //   );
          // }
        }else{
          Matter.Body.applyForce(
            bodies[i],
            Matter.Vertices.centre(bodies[i].vertices),
            createVertex(0, 0.00098 * bodies[i].mass)
          );
        }
      }
      objects[i].vertices = bodies[i].vertices;
    }
    for (i = 0; i < bodies.length; i++) {
      if (!bodies[i].isStatic && bodies[i].force.y > 0) {
        // console.log(bodies[i].force.y);
        // console.log({ force: bodies[i].force, mass: bodies[i].mass });
      }
    }
    if (selectedObject != null || selectedObject != undefined) {
      // renderDisplayUI(selectedObject);
    }
    //Make Engine Move Foward By Delta Time
    Matter.Engine.update(engine, deltaTime);
  }

  //Run the Animate Function again to make it recursive
  requestAnimationFrame(animate);
}
//Initial Animate Start
animate();

function calculateTension(c, bodies) {
  // console.log(bodies[c.obj1])
  // console.log(bodies[c.obj2])
  var tension =
    (2 * 0.00098 * bodies[c.obj1].mass * bodies[c.obj2].mass) /
    (bodies[c.obj1].mass + bodies[c.obj2].mass);

  return tension;
}
function calculateTension1(c, body1, body2) {

  var weight1 = Math.abs(body1.mass * 0.00098 * Math.sin(Math.atan((body1.position.y - c.obj1Tan.y) / (body1.position.x - c.obj1Tan.x))));
  var weight2 = Math.abs(body2.mass * 0.00098 * Math.sin(Math.atan((body2.position.y - c.obj2Tan.y) / (body2.position.x - c.obj2Tan.x))));
  console.log("Tension Weight: " + weight1 + " " + weight2)
  //If Object GOING DOWN SUbtract friction
  var friction1 = body1.mass * 0.00098 * Math.cos(Math.atan((body1.position.y - c.obj1Tan.y) / (body1.position.x - c.obj1Tan.x))) * 0.2;
  var friction2 = body2.mass * 0.00098 * Math.cos(Math.atan((body2.position.y - c.obj2Tan.y) / (body2.position.x - c.obj2Tan.x))) * 0.2;
  weight1 += friction1
  weight2 += friction2
  var accelerationMagnitude =
    (Math.abs(weight1 - weight2)) /
    (body1.mass + body2.mass);
  console.log("A-Mag: " + accelerationMagnitude)
  // if (accelerationMagnitude < 0) {
  //   accelerationMagnitude = 0;
  // }
  // console.log({weight1: weight1, weight2: weight2, fric1: friction1, fric2: friction2, a: accelerationMagnitude, cos: (Math.abs(c.obj1Tan.x - body1.position.x) / vertexDistance(c.obj1Tan, body1.position))})
  return Math.abs(accelerationMagnitude);
}

/*
  This method will take all the objects from the objects 
  array and draw them onto the canvas using their vertices

  @params
  ctx - context for the canvas to draw on 
*/
function drawObjects(ctx) {
  /**
   * The first for loop randomizes the colors in colorPalette and stores them in the global colors array
   * If there are no more colors availabe in the colors array, then the default fill color used is #fc7303 (light orange) 
   */
  var colorPalette = ["#f4c604", "#f69500", "#ff6700", "#ff004d", "#e50068", "#005cff", "#00ff1c", "#d9ff00", 
  "#ffdc00", "#ff005a", "#ffcc00", "#66ccff", "#33cc99", "#ff3366", "#ff9900", "#f752bd", "#13e873", "#e9ff21",
  "#52ed1a", "#864bbd", "#22d6d6", "#fc7303", "#de2904", "#c732ae", "#13a15a", "#1e5de6", "#ffe817", "#90ed39", 
  "#f2189f", "#d41313", "#632bbd", "#1367cf"]
  if (!simDrawn){
    for (i = 0;i < colorPalette.length;i++){
      var colorIndex = Math.floor(Math.random()*colorPalette.length);
      colors.push(colorPalette[colorIndex]);
      var index = colorPalette.indexOf(colorIndex);
      if (index > -1) {
        array.splice(index, 1);
      }
    }
    simDrawn = true;
  }
  

  for (i = 0; i < objects.length; i++) {
    ctx.beginPath();
    if (i >= colors.length){
      ctx.fillStyle = "#fc7303";
    }
    else {
      ctx.fillStyle = colors[i];
    }
    
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
function calcSlope(v1, v2) {
  return (v2.y - v1.y) / (v2.x - v1.x);
}

function drawTangentalLine(obj, pulley, connection) {
  var ctx = document.getElementById("window").getContext("2d");

  var pulleyCenter = Matter.Vertices.centre(objects[pulley].vertices);
  // console.log("pulley center: " + pulleyCenter);
  var pulleyRadius = 50;
  var objCenter = Matter.Vertices.centre(objects[obj].vertices);
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
    if (
      connection.hasOwnProperty("lastObj1Tan") &&
      connection.hasOwnProperty("lastObj2Tan")
    ) {
      var lastPosition = connection.lastObj1Tan;
      if (obj == connection.obj2) {
        lastPosition = connection.lastObj2Tan;
      }
      if (lastPosition != null) {
        var dist1 = vertexDistance(
          createVertex(tangents[0], tangents[1]),
          lastPosition
        );
        var dist2 = vertexDistance(
          createVertex(tangents[2], tangents[3]),
          lastPosition
        );
        if (dist1 < dist2) {
          startIndex = 0;
          endIndex = 1;
        } else {
          startIndex = 1;
          endIndex = 2;
        }
      }
    }
    for (i = startIndex; i < endIndex; i++) {
      if (connection.obj1 == obj) {
        connection.lastObj1Tan = connection.obj1Tan;
        connection.obj1Tan = createVertex(tangents[i * 2], tangents[1 + i * 2]);
      } else {
        connection.lastObj2Tan = connection.obj2Tan;
        connection.obj2Tan = createVertex(tangents[i * 2], tangents[1 + i * 2]);
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

function calcualteRopeLength(connection, objects) {
  // console.log(connection)
  var center1 = Matter.Vertices.centre(objects[connection.obj1].vertices);
  var center2 = Matter.Vertices.centre(objects[connection.obj2].vertices);
  var dist =
    vertexDistance(center1, connection.obj1Tan) +
    vertexDistance(center2, connection.obj2Tan);
  return dist;
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
function createRect(x, y, w, h, type) {
  var vertices = [
    createVertex(x, y),
    createVertex(x + w, y),
    createVertex(x + w, y + h),
    createVertex(x, y + h)
  ];
  return createObject(vertices, type);
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
function createCircle(radius, objType, mass, type) {
  if (type === "circleObject") {
    // circleRadius = newRadius;
    var newRadius = determineMass(mass);
    // circleRadius = newRadius;
    var circle = Matter.Bodies.circle(50, 50, newRadius);
    var obj = createObject(circle.vertices, objType);

    objects.push(obj);
  } else {
    var circle = Matter.Bodies.circle(50, 50, radius);
    objects.push(createObject(circle.vertices, objType));
  }
}

function determineMass(mass) {
  var radiusDefault = 15;
  return radiusDefault * mass;
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
function createObject(vertices, objType) {
  if (objType == "floor") {
    console.log("objType::" + objType);
  }
  return {
    vertices: vertices,
    rotation: 0,
    type: objType,
    properties: { mass: 1, isStatic: false }
  };
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
  return {
    x: x,
    y: y,
    magnitude: function() {
      return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }
  };
}

/*
  This turns the canvas objects into bodies and starts
  the physics engine to simulate them
*/
function runSim() {
  console.log(objects);
  //Create a new Physics Engine
  var e = Matter.Engine.create();
  e.world.gravity.y = 0; //0.98;
  objectProperties = [];
  for (i = 0; i < objects.length; i++) {
    //Create a physics body from the vertices
    // if (i < 3 || i == 5) {
    console.log(objects[i].type);
    // if (
    //   objects[i].type == "floor" ||
    //   objects[i].type == "leftWall" ||
    //   objects[i].type == "rightWall" ||
    //   objects[i].type == "pulley" ||
    //   objects[i].type == "ramp"
    // ) {
    //   var obj = Matter.Body.create({
    //     position: Matter.Vertices.centre(objects[i].vertices),
    //     vertices: objects[i].vertices,
    //     frictionAir: 0,
    //     friction: 0,
    //     restitution: 0,
    //     isStatic: true,
    //     velocity: { x: 0, y: 0 }
    //   });
    //   //Add these bodies to the world
    //   Matter.World.add(e.world, [obj]);
    // } else {
    //   var obj = Matter.Body.create({
    //     position: Matter.Vertices.centre(objects[i].vertices),
    //     vertices: objects[i].vertices,
    //     frictionAir: 0,
    //     friction: 0,
    //     restitution: 0,
    //     mass: 10,
    //     isStatic: false,
    //     velocity: { x: 0, y: 0 },
    //     inertia: Infinity
    //   });
    //   // console.log(obj.mass)
    //   // console.log(objects[i].properties.mass);
    //   // Matter.Body.setMass(obj, objects[i].properties.mass);
    //   if (i == 3) {
    //     Matter.Body.setMass(obj, 5);
    //   }
    //   // console.log(obj.position);
    //   //Add these bodies to the world
    //   console.log("1");
    //   console.log(obj);
    //   Matter.World.add(e.world, [obj]);
    // }
    var obj = Matter.Body.create({
      position: Matter.Vertices.centre(objects[i].vertices),
      vertices: objects[i].vertices,
      frictionAir: 0,
      friction: 0,
      restitution: 0,
      velocity: { x: 0, y: 0 },
      inertia: Infinity,
      isStatic: objects[i].properties.isStatic,
      mass: objects[i].properties.mass
    });
    // Add these bodies to the world
    Matter.World.add(e.world, [obj]);
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

  var c1 = 0;
  var c2 = 1;
  var c3 = 2;

  for (i = 0; i < objects.length; i++) {
    if (objects[i].type == "obj1") {
      c1 = i;
    }
    if (objects[i].type == "obj2") {
      c2 = i;
    }
    if (objects[i].type == "pulley") {
      c3 = i;
    }
  }

  connections.push(
    // createConnection(objects.length - 3, objects.length - 2, objects.length - 1)
    // createConnection(objects[c1], objects[c2], objects[c3])
    createConnection(c1, c2, c3)
  );
  if(selectedObject != null && selectedObject != undefined){
    renderDisplayUI(selectedObject)
  }
  
}
function createConnection(obj1, obj2, pulley) {
  // if (obj1.type == "obj1" && obj2.type == "obj2"){
  var c = {
    obj1: obj1,
    obj2: obj2,
    pulley: pulley,
    obj1Tan: null,
    obj2Tan: null
  };
  return c;
  // }
  // return undefined;
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
    lines = [];
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
      snapToTangent(dragIndex, e.pageX);
      if (objects[dragIndex].vertices.length > 4) {
        pulleySnap(
          objects[dragIndex],
          translatePointOnCanvas(createVertex(e.pageX, e.pageY))
        );
      }
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

  lines = [];
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

function pulleySnap(pulley, mouse) {
  var closestRamp;
  var distance = -1;
  for (i = 0; i < objects.length; i++) {
    if (objects[i].vertices.length == 3) {
      if (distance == -1) {
        closestRamp = objects[i];
        distance = objDistance(pulley, objects[i]);
      } else {
        var d2 = objDistance(pulley, objects[i]);
        if (d2 < distance) {
          closestRamp = objects[i];
          distance = d2;
        }
      }
    }
  }
  if (closestRamp == null) {
    return;
  }
  var pulleyCenter = Matter.Vertices.centre(pulley.vertices);
  var radius = vertexDistance(pulleyCenter, pulley.vertices[0]);

  var vertices = closestRamp.vertices;
  var slopes = [
    calcSlope(vertices[0], vertices[1]),
    calcSlope(vertices[1], vertices[2]),
    calcSlope(vertices[2], vertices[0])
  ];
  var slope;
  var b;
  for (s = 0; s < slopes.length; s++) {
    if (
      slopes[s] != 0 &&
      slopes[s] != undefined &&
      slopes[s] != -0 &&
      slopes[s] != Infinity &&
      slopes[s] != -Infinity
    ) {
      slope = slopes[s];
      b = vertices[s].y - slope * vertices[s].x;
    }
  }
  b -= 15 / Math.cos(Math.atan(slope));

  var perpendicularSlope = -1 / slope;
  var b2 = pulleyCenter.y - pulleyCenter.x * perpendicularSlope;

  var intersectionX = (b2 - b) / (slope - perpendicularSlope);
  var intersectionY = perpendicularSlope * intersectionX + b2;

  var d = vertexDistance(
    createVertex(intersectionX, intersectionY),
    pulleyCenter
  );
  d -= radius;

  var translation = createVertex(
    d * Math.cos(Math.atan(perpendicularSlope)),
    d * Math.sin(Math.atan(perpendicularSlope))
  );
  if (mouse.y > intersectionY) {
    translation.x *= -1;
    translation.y *= -1;
  }
  console.log(d);
  if (vertexDistance(mouse, createVertex(intersectionX, intersectionY)) < 100) {
    for (v = 0; v < pulley.vertices.length; v++) {
      pulley.vertices[v].x += translation.x;
      pulley.vertices[v].y += translation.y;
    }
    lines.push({
      start: createVertex(0, b),
      end: createVertex(1000, 1000 * slope + b)
    });
  }
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
    var closestDistance;
    var threshold;
    if (distance != -1) {
      var objectCenter = Matter.Vertices.centre(objects[index].vertices);
      var vertexDistances = [];
      for (v = 0; v < objects[closestRampIndex].vertices.length; v++) {
        vertexDistances.push(
          vertexDistance(objectCenter, objects[closestRampIndex].vertices[v])
        );
      }
      vertexDistances.push(distance);
      closestDistance = Math.min(...vertexDistances);

      var rampCenter = Matter.Vertices.centre(
        objects[closestRampIndex].vertices
      );
      var vD = [];
      for (v = 0; v < 3; v++) {
        vD.push(
          vertexDistance(rampCenter, objects[closestRampIndex].vertices[v])
        );
      }
      threshold = Math.max(...vD);
    }
    console.log(threshold);
    if (distance != -1 && closestDistance < 100) {
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

function snapToTangent(index, mouseX) {
  for (i = 0; i < objects.length; i++) {
    if (i == index) {
      continue;
    }
    if (objects[i].vertices.length > 4) {
      //Is Circle
      var cirlceCenter = Matter.Vertices.centre(objects[i].vertices);
      var radius = vertexDistance(cirlceCenter, objects[i].vertices[0]);
      var tanPoints = [
        createVertex(cirlceCenter.x - radius, cirlceCenter.y),
        createVertex(cirlceCenter.x + radius, cirlceCenter.y)
      ];

      var center = Matter.Vertices.centre(objects[index].vertices);
      var tanX = tanPoints[0].x;
      if (Math.abs(tanPoints[1].x - center.x) < Math.abs(tanX - center.x)) {
        tanX = tanPoints[1].x;
      }
      if (Math.abs(mouseX - tanX) < 35) {
        var xTranslation = tanX - center.x;
        for (v = 0; v < objects[index].vertices.length; v++) {
          objects[index].vertices[v].x += xTranslation;
        }
        lines.push({
          start: createVertex(tanX, 0),
          end: createVertex(tanX, 800)
        });
      }
    }
  }
}

//End Drag

window.addEventListener(
  "message",
  function(e) {
    if (e.data == "close") {
      closeTriangleBuilder();
    } else {
      var obj = createObject(e.data, "ramp");
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

("use strict");

const e = React.createElement;

class InputField extends React.Component {
  constructor(props) {
    super(props);
  }
  updateObject(element) {
    var value = element.value;
    if (element.type == "checkbox") {
      value = element.checked;
    } else if (element.type == "number") {
      value = parseFloat(value);
    }
    this.props.object.properties[element.id] = value;
  }
  render() {
    var title = e(
      "p",
      { style: { display: "inline-block", width: "75px", fontSize: "20px" } },
      this.props.name + ": "
    );
    var input = e(
      "input",
      {
        type: this.props.type,
        placeholder: "Value",
        defaultValue: this.props.curVal,
        defaultChecked: this.props.curVal,
        id: this.props.name,
        style: {
          height: "30px",
          marginTop: "16px",
          fontSize: "20px",
          width: "200px"
        },
        onChange: () =>
          this.updateObject(document.querySelector("#" + this.props.name))
      },
      null
    );

    return e(
      "div",
      {
        style: {
          display: "grid",
          gridTemplateColumns: "max-content min-content",
          gridGap: "5px",
          height: "50px"
        }
      },
      title,
      input
    );
  }
  
}
class InfoField extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      val: props.val
    };
  }
  render() {
    var title = e(
      "p",
      { style: { display: "inline-block", width: "75px", fontSize: "20px" } },
      this.props.name
    );
    var unit = ""
    if(units[this.props.name] != undefined){
      unit = units[this.props.name]
    }
    var value = e(
      "p",
      {
        style: {
          height: "30px",
          marginTop: "16px",
          fontSize: "20px",
          width: "200px",
          textAlign: 'right'
        }
      },
      "" + this.state.val + " " + unit
    );

    return e(
      "div",
      {
        style: {
          display: "grid",
          gridTemplateColumns: "max-content min-content",
          gridGap: "5px",
          height: "50px"
        }
      },
      title,
      value
    );
  }

  componentDidMount() {
    this.interval = setInterval(() => this.setState({ val: this.props.object.properties[this.props.name] }), 16);
  }
  componentWillUnmount() {
    clearInterval(this.interval);
  }
}
class Menu extends React.Component {
  constructor(props) {
    super(props);
  }
  update() {}
  render() {
    if (this.props.mode == "edit") {
      var inputFields = [];
      var properties = this.props.object.properties;
      var propertyKeys = Object.keys(properties);
      for (var p = 0; p < propertyKeys.length; p++) {
        var field = e(InputField, {
          name: propertyKeys[p],
          curVal: properties[propertyKeys[p]],
          type: propertyTypes[propertyKeys[p]],
          object: this.props.object,
          key: p
        });
        inputFields.push(field);
      }

      return e(
        "div",
        {
          style: {
            width: "300px",
            backgroundColor: "#5d808c",
            border: "dashed",
            marginLeft: "20px",
            paddingLeft: "10px"
          }
        },
        inputFields
      );
    } else {
      var valueFields = [];
      var properties = this.props.object.properties;
      var propertyKeys = Object.keys(properties);
      for (var p = 0; p < propertyKeys.length; p++) {
        var field = e(InfoField, {
          val: properties[propertyKeys[p]],
          name: propertyKeys[p],
          key: p,
          object: this.props.object
        });
        valueFields.push(field);
      }
      // var self = this;
      // setTimeout(function() {
      //   self.setState({});
      // }, 100);
      return e(
        "div",
        { style: {
          width: "300px",
          backgroundColor: "#5d808c",
          border: "dashed",
          marginLeft: "20px",
          paddingLeft: "10px"
        } },
        valueFields
      );
    }
  }
}

const domConatiner = document.querySelector("#optionDisplay");
function renderUI(object) {
  ReactDOM.unmountComponentAtNode(domConatiner);
  menu = e(Menu, { object: object, mode: "edit" });
  ReactDOM.render(menu, domConatiner);
}
function renderDisplayUI(object) {
  ReactDOM.unmountComponentAtNode(domConatiner);
  menu = e(Menu, { object: object, mode: "view" });
  ReactDOM.render(menu, domConatiner);
}

document.getElementById("window").addEventListener("click", function(e) {
  var canvasPoint = translatePointOnCanvas(createVertex(e.pageX, e.pageY));
  for (i = 0; i < objects.length; i++) {
    //Check if pointer was inside an object when clicked.
    if (Matter.Vertices.contains(objects[i].vertices, canvasPoint)) {
      if (usePhysics) {
        selectedObject = objects[i];
        renderDisplayUI(selectedObject)
      } else {
        renderUI(objects[i], i);
        selectedObject = objects[i];
      }
      break;
    }
  }
});
