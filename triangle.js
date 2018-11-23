var angles;
var sides;

function drawTriangle() {
  var canvas = document.getElementById("window");
  var ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  var vertices = createVertices();

  ctx.beginPath();
  ctx.moveTo(vertices[0].x, vertices[0].y);
  for (i = 1; i < vertices.length; i++) {
    ctx.lineTo(vertices[i].x, vertices[i].y);
  }
  ctx.lineTo(vertices[0].x, vertices[0].y);
  ctx.stroke();
}

function createVertices() {
  var canvas = document.getElementById("window");
  var vertex0 = { x: 100, y: 600 };

  var vertex1 = {
    x: 100 + 100 * sides[2] * Math.cos(toRads(angles[0])),
    y: 600 - 100 * sides[2] * Math.sin(toRads(angles[0]))
  };

  var vertex2 = {
    x: vertex1.x + 100 * sides[0] * Math.cos(toRads(angles[2])),
    y: vertex1.y + 100 * sides[0] * Math.sin(toRads(angles[2]))
  };
  var vertices = [vertex0, vertex1, vertex2];
  var midPoint = {
    x: (vertices[0].x + vertices[1].x + vertices[2].x) / 3,
    y: (vertices[0].y + vertices[1].y + vertices[2].y) / 3
  };
  var translation = {
    x: canvas.width / 2 - midPoint.x,
    y: canvas.height / 2 - midPoint.y
  };
  for (i = 0; i < vertices.length; i++) {
    vertices[i].x += translation.x;
    vertices[i].y += translation.y;
  }
  return vertices;
}

function toRads(angle) {
  return angle * (Math.PI / 180);
}

function checkTriangle(a, s) {
  if (a[0] + a[1] + a[2] - 180 > 0.01) {
    return false;
  }

  if (
    lawOfSin(a[0], s[0], a[1], s[1]) &&
    lawOfSin(a[0], s[0], a[2], s[2]) &&
    lawOfSin(a[1], s[1], a[2], s[2])
  ) {
    return true;
  }
  return false;
}

function lawOfSin(a1, s1, a2, s2) {
  if (Math.abs(s1 / Math.sin(toRads(a1)) - s2 / Math.sin(toRads(a2))) < 0.01) {
    return true;
  }
  return false;
}

function onValueChanged() {
  var a = [
    parseFloat(document.getElementById("angleA").value),
    parseFloat(document.getElementById("angleB").value),
    parseFloat(document.getElementById("angleC").value)
  ];
  var s = [
    parseFloat(document.getElementById("sideA").value),
    parseFloat(document.getElementById("sideB").value),
    parseFloat(document.getElementById("sideC").value)
  ];
  if (checkTriangle(a, s)) {
    angles = a;
    sides = s;
    drawTriangle();
    document.getElementById("valid-disp").innerHTML = "Valid";
  } else {
    document.getElementById("valid-disp").innerHTML = "Invalid";
  }
}

function submit() {
  window.parent.postMessage(createVertices(), "*");
}
