const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');


// Responsive canvas setup
function resizeCanvas() {
  // Use the CSS sizes to set actual drawing size
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  // Adjust your game logic if needed
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Game settings
const paddleWidth = 12*canvas.width/800;
const paddleHeight = 80*canvas.height/500;
const ballRadius = Math.max(4,10*canvas.width/800);

// Left paddle (player)
let leftPaddleY = canvas.height / 2 - paddleHeight / 2;

// Right paddle (AI)
let rightPaddleY = canvas.height / 2 - paddleHeight / 2;
let rightPaddleMaxSpeed = 7*canvas.height/500;

// Ball
let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let baseBallSpeed = 5*canvas.width/800;
let ballSpeed = baseBallSpeed;
let ballAngle = Math.random() * Math.PI / 4 - Math.PI / 8;
let ballDX = ballSpeed * (Math.random() < 0.5 ? -1 : 1) * Math.cos(ballAngle);
let ballDY = ballSpeed * Math.sin(ballAngle);

let prevBallX = ballX;

// Score
let leftScore = 0;
let rightScore = 0;
let winner = null;
let animationTime = 500;

function checkWin() {
  if (leftScore >= 12) {
    winner = 'You win';
  } else if (rightScore >= 12) {
    winner = 'You lose';
  }
}

function drawWinAnimation() {
  if (!winner || animationTime <= 0) return;
  ctx.save();

  // Colorful background flash
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = `hsl(${Math.random()*360},100%,50%)`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 1;

  // Bouncing winning text
  let bounce = Math.sin(animationTime/8) * 20;
  ctx.font = "bold 60px Comic Sans MS, Arial";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.fillText(`${winner} 🎉`, canvas.width/2, canvas.height/2 + bounce);

  // Simple confetti (random circles)
  for (let i=0; i<30; i++) {
    ctx.beginPath();
    ctx.arc(
      Math.random()*canvas.width,
      Math.random()*canvas.height,
      Math.random()*8+2,
      0, 2*Math.PI
    );
    ctx.fillStyle = `hsl(${Math.random()*360},100%,50%)`;
    ctx.fill();
  }

  ctx.restore();
  animationTime--;
}

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

// Track mouse activity
let mouseActive = false;

canvas.addEventListener('mousemove', function(e) {
  mouseActive = true;
  const rect = canvas.getBoundingClientRect();
  let mouseY = e.clientY - rect.top;
  leftPaddleY = mouseY - paddleHeight / 2;

  // Clamp within canvas
  if (leftPaddleY < 0) leftPaddleY = 0;
  if (leftPaddleY > canvas.height - paddleHeight) leftPaddleY = canvas.height - paddleHeight;
});

canvas.addEventListener('mouseleave', function() {
  mouseActive = false;
});

// Joystick controls for mobile
const joystickContainer = document.getElementById('joystick-container');
const joystickKnob = document.getElementById('joystick-knob');
let joystickActive = false;
let joystickStartY = 0;
let joystickCurrentY = 0;

if (joystickKnob && joystickContainer) {
  joystickKnob.addEventListener('touchstart', function(e) {
    joystickActive = true;
    joystickStartY = e.touches[0].clientY;
    joystickContainer.classList.add('active');
    // Reset knob position and transform
    joystickKnob.style.top = '40px';
    joystickKnob.style.transform = 'scale(1.2)';
    e.preventDefault();
  }, {passive: false});

  window.addEventListener('touchmove', function(e) {
    if (!joystickActive || mouseActive) return;
    joystickCurrentY = e.touches[0].clientY;
    let deltaY = joystickCurrentY - joystickStartY;
    leftPaddleY += deltaY * 0.7;
    if (leftPaddleY < 0) leftPaddleY = 0;
    if (leftPaddleY > canvas.height - paddleHeight) leftPaddleY = canvas.height - paddleHeight;
    // Move knob visually, clamp within a larger range
    let knobY = Math.max(-80, Math.min(80, deltaY * 0.35));
    joystickKnob.style.top = (40 + knobY) + 'px';
    joystickKnob.style.transform = 'scale(1.2)';
    joystickStartY = joystickCurrentY;
  }, {passive: false});

  window.addEventListener('touchend', function(e) {
    joystickActive = false;
    joystickContainer.classList.remove('active');
    // Reset knob position and transform/animation
    joystickKnob.style.transition = 'top 0.15s, transform 0.2s';
    joystickKnob.style.top = '40px';
    joystickKnob.style.transform = 'scale(1)';
    setTimeout(() => {
      joystickKnob.style.transition = '';
    }, 200);
  }, {passive: false});
}

function resetBall(direction) {
  // Randomize direction if not specified
  if (typeof direction === "undefined") {
    direction = Math.random() < 0.5 ? -1 : 1;
  }
  ballX = canvas.width / 2;
  ballY = canvas.height / 2;
  // Set speed to the maximum between current speed divided by 2 and base speed
  ballSpeed = Math.max(ballSpeed / 2, baseBallSpeed);
  ballAngle = Math.random() * Math.PI / 4 - Math.PI / 8;
  ballDX = ballSpeed * direction * Math.cos(ballAngle);
  ballDY = ballSpeed * Math.sin(ballAngle);
}


function increaseBallSpeed() {
  ballSpeed *= 1.07; // Increase by 7% each rebound
  let angle = Math.atan2(ballDY, ballDX);
  ballDX = ballSpeed * Math.cos(angle);
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
    ballDX = Math.abs(ballDX); // Always move right
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
    ballDX = -Math.abs(ballDX); // Always move left
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
  checkWin();
  if (winner) {
    resetBall(0);
    
    drawWinAnimation();
    if (animationTime <= 0) {
      // Optionally, reset game or show restart button
    }
    return; // Stop game updates during animation if desired
  }
}

resetBall();
gameLoop();
