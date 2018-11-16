// var engine = Matter.Engine.create();

// var render = Matter.Render.create({
//   element: document.getElementById("matter-window"),
//   engine: engine
// });

// var box = Matter.Bodies.rectangle(400, 200, 80, 80);
// var ground = Matter.Bodies.rectangle(400, 610, 2000, 60, { isStatic: true });

// Matter.World.add(engine.world, [box, ground]);

// Matter.Render.run(render);

// var mouse = Matter.Mouse.create(render.canvas),
//   mouseConstraint = Matter.MouseConstraint.create(engine, {
//     mouse: mouse,
//     constraint: {
//       stiffness: 0.2,
//       render: {
//         visible: false
//       }
//     }
//   });

// Matter.World.add(engine.world, mouseConstraint);

// function runSim() {
//   Matter.Engine.run(engine);
// }

var objects = [];
var engine;
var usePhysics = false;
var lastTime = 0;

function animate(timeRan) {
  var canvas = document.getElementById("window");
  var ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawObjects(ctx);

  if (usePhysics) {
    var deltaTime = timeRan - lastTime;
    lastTime = timeRan;
    console.log(deltaTime);
    // Matter.Engine.update(engine, deltaTime);
    var bodies = Matter.Composite.allBodies(engine.world);
    objects = [];
    for (i = 0; i < bodies.length; i++) {
      objects.push(createObject(bodies[i].vertices));
    }
  }
  requestAnimationFrame(animate);
}
function drawObjects(ctx) {
  ctx.fillStyle = "000000";
  for (i = 0; i < objects.length; i++) {
    ctx.beginPath();
    ctx.moveTo(objects[i].vertices[0].x, objects[i].vertices[0].y);
    for (v = 1; v < objects[i].vertices.length; v++) {
      ctx.lineTo(objects[i].vertices[v].x, objects[i].vertices[v].y);
    }
    ctx.lineTo(objects[i].vertices[0].x, objects[i].vertices[0].y);
    ctx.fill();
  }
}

function createRect(x, y, w, h) {
  var rect = {};
  rect.vertices = [
    createVertex(x, y),
    createVertex(x + w, y),
    createVertex(x + w, y + h),
    createVertex(x, y + h)
  ];
  objects.push(rect);
  return rect;
}
function createObject(vertices) {
  return { vertices: vertices };
}
function createVertex(x, y) {
  return { x: x, y: y };
}

function runSim() {
  var e = Matter.Engine.create();
  for (i = 0; i < objects.length; i++) {
    var obj = Matter.Body.create({
      position: Matter.Vertices.centre(objects[i].vertices),
      vertices: objects[i].vertices
    });
    console.log(obj.position);
    Matter.World.add(e.world, [obj]);
  }
  engine = e;
  usePhysics = true;

  var render = Matter.Render.create({
    element: document.getElementById("matter-window"),
    engine: engine
  });
  Matter.Render.run(render);
  Matter.Engine.run(engine);
}
