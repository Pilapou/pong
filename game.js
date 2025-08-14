const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');

// Game settings
const paddleWidth = 12;
const paddleHeight = 80;
const ballRadius = 10;

// Left paddle (player)
let leftPaddleY = canvas.height / 2 - paddleHeight / 2;

// Right paddle (AI)
let rightPaddleY = canvas.height / 2 - paddleHeight / 2;
let rightPaddleMaxSpeed = 7;

// Ball
let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let baseBallSpeed = 5;
let ballSpeed = baseBallSpeed;
let ballAngle = Math.random() * Math.PI / 4 - Math.PI / 8;
let ballDX = ballSpeed * (Math.random() < 0.5 ? -1 : 1) * Math.cos(ballAngle);
let ballDY = ballSpeed * Math.sin(ballAngle);

let prevBallX = ballX;

// Score
let leftScore = 0;
let rightScore = 0;

function drawRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function drawCircle(x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fill();
}

function drawText(text, x, y, size = 36) {
  ctx.fillStyle = "#fff";
  ctx.font = `${size}px Arial`;
  ctx.fillText(text, x, y);
}

function resetBall(direction = 1) {
  ballX = canvas.width / 2;
  ballY = canvas.height / 2;
  ballSpeed = baseBallSpeed;
  ballAngle = Math.random() * Math.PI / 4 - Math.PI / 8;
  ballDX = ballSpeed * direction * Math.cos(ballAngle);
  ballDY = ballSpeed * Math.sin(ballAngle);
}

canvas.addEventListener('mousemove', function(e) {
  const rect = canvas.getBoundingClientRect();
  let mouseY = e.clientY - rect.top;
  leftPaddleY = mouseY - paddleHeight / 2;

  // Clamp within canvas
  if (leftPaddleY < 0) leftPaddleY = 0;
  if (leftPaddleY > canvas.height - paddleHeight) leftPaddleY = canvas.height - paddleHeight;
});

function increaseBallSpeed() {
  ballSpeed *= 1.07; // Increase by 7% each rebound
  let angle = Math.atan2(ballDY, ballDX);
  let sign = ballDX > 0 ? 1 : -1;
  ballDX = ballSpeed * sign * Math.cos(angle);
  ballDY = ballSpeed * Math.sin(angle);
}

function update() {
  prevBallX = ballX;

  // Ball movement
  ballX += ballDX;
  ballY += ballDY;

  // Top/bottom wall collision
  if (ballY - ballRadius < 0) {
    ballY = ballRadius;
    ballDY = -ballDY;
  } else if (ballY + ballRadius > canvas.height) {
    ballY = canvas.height - ballRadius;
    ballDY = -ballDY;
  }

  // Left paddle collision (only if ball is moving left and crosses paddle boundary)
  if (
    ballDX < 0 &&
    prevBallX - ballRadius > paddleWidth &&
    ballX - ballRadius <= paddleWidth &&
    ballY > leftPaddleY &&
    ballY < leftPaddleY + paddleHeight
  ) {
    ballX = paddleWidth + ballRadius + 1; // Place ball just outside paddle
    ballDX = -ballDX;
    let hitPos = (ballY - leftPaddleY - paddleHeight / 2) / (paddleHeight / 2);
    ballDY = ballSpeed * hitPos;
    increaseBallSpeed();
  }

  // Right paddle collision (only if ball is moving right and crosses paddle boundary)
  if (
    ballDX > 0 &&
    prevBallX + ballRadius < canvas.width - paddleWidth &&
    ballX + ballRadius >= canvas.width - paddleWidth &&
    ballY > rightPaddleY &&
    ballY < rightPaddleY + paddleHeight
  ) {
    ballX = canvas.width - paddleWidth - ballRadius - 1; // Place ball just outside paddle
    ballDX = -ballDX;
    let hitPos = (ballY - rightPaddleY - paddleHeight / 2) / (paddleHeight / 2);
    ballDY = ballSpeed * hitPos;
    increaseBallSpeed();
  }

  // Left wall scoring (ball fully out)
  if (ballX < -ballRadius) {
    rightScore++;
    resetBall(1);
  }
  // Right wall scoring (ball fully out)
  if (ballX > canvas.width + ballRadius) {
    leftScore++;
    resetBall(-1);
  }

  // AI paddle movement (smooth, capped speed)
  let targetY = ballY - paddleHeight / 2;
  let diff = targetY - rightPaddleY;
  let move = Math.sign(diff) * Math.min(Math.abs(diff), rightPaddleMaxSpeed);
  rightPaddleY += move;
  if (rightPaddleY < 0) rightPaddleY = 0;
  if (rightPaddleY > canvas.height - paddleHeight) rightPaddleY = canvas.height - paddleHeight;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < canvas.height; y += 30) {
    drawRect(canvas.width / 2 - 2, y, 4, 20, "#555");
  }
  drawRect(0, leftPaddleY, paddleWidth, paddleHeight, "#0f0");
  drawRect(canvas.width - paddleWidth, rightPaddleY, paddleWidth, paddleHeight, "#f00");
  drawCircle(ballX, ballY, ballRadius, "#fff");
  drawText(leftScore, canvas.width / 4, 40);
  drawText(rightScore, (canvas.width * 3) / 4, 40);
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

resetBall();
gameLoop();
