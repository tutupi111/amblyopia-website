const defaultTasks = [
  "动态黑白条栅训练 10 分钟",
  "对比敏感训练 10 分钟",
  "视动追踪训练 8 分钟",
  "视觉记忆训练 10 分钟",
  "红蓝分视融合训练 8 分钟",
  "双眼接球训练 8 分钟",
  "方块拼接训练 12 分钟"
];

const modal = document.getElementById("gameModal");
const modalTitle = document.getElementById("modalTitle");
const gameScreens = [...document.querySelectorAll(".game-screen")];
let activeScreenId = "";

function openScreen(id) {
  activeScreenId = id;
  modal.classList.remove("hidden");
  gameScreens.forEach((screen) => {
    const visible = screen.id === id;
    screen.classList.toggle("hidden", !visible);
    if (visible) modalTitle.textContent = screen.dataset.title || "训练游戏";
  });
}

function closeScreen() {
  modal.classList.add("hidden");
  activeScreenId = "";
}

document.querySelectorAll("[data-open]").forEach((btn) => {
  btn.addEventListener("click", () => openScreen(btn.dataset.open));
});
document.getElementById("closeModal").addEventListener("click", closeScreen);

function loadTasks() {
  const tasks = JSON.parse(localStorage.getItem("tasks") || "null") || defaultTasks;
  localStorage.setItem("tasks", JSON.stringify(tasks));
  const el = document.getElementById("tasks");
  el.innerHTML = tasks
    .map((t, i) => `<label><input type='checkbox' data-i='${i}'> ${t}</label><br>`) 
    .join("");
}

document.getElementById("resetTasks").addEventListener("click", () => {
  localStorage.setItem("tasks", JSON.stringify(defaultTasks));
  loadTasks();
});

function loadStats() {
  document.getElementById("streak").textContent = localStorage.getItem("streak") || 0;
  document.getElementById("totalSessions").textContent = localStorage.getItem("totalSessions") || 0;
}

document.getElementById("completeSession").addEventListener("click", () => {
  const total = Number(localStorage.getItem("totalSessions") || 0) + 1;
  localStorage.setItem("totalSessions", String(total));

  const today = new Date().toISOString().slice(0, 10);
  const last = localStorage.getItem("lastSessionDate");
  let streak = Number(localStorage.getItem("streak") || 0);

  if (!last) streak = 1;
  else {
    const diff = (new Date(today) - new Date(last)) / (24 * 3600 * 1000);
    if (diff === 1) streak += 1;
    else if (diff > 1) streak = 1;
  }

  localStorage.setItem("streak", String(streak));
  localStorage.setItem("lastSessionDate", today);
  loadStats();
});

// Game 1: Contrast click
const contrastArea = document.getElementById("contrastGame");
const contrastScore = document.getElementById("contrastScore");
let cScore = 0;
function spawnContrastTarget(level = 1) {
  contrastArea.innerHTML = "";
  const dot = document.createElement("div");
  dot.className = "target";
  const v = 245 - Math.min(level * 8, 80);
  dot.style.background = `rgb(${v}, ${v}, ${v})`;
  dot.style.left = `${Math.random() * 90}%`;
  dot.style.top = `${Math.random() * 80}%`;
  dot.addEventListener("click", () => {
    cScore += 1;
    contrastScore.textContent = cScore;
    spawnContrastTarget(1 + Math.floor(cScore / 3));
  });
  contrastArea.appendChild(dot);
}
document.getElementById("startContrast").addEventListener("click", () => {
  cScore = 0;
  contrastScore.textContent = cScore;
  spawnContrastTarget();
});

// Game 2: tracking
const trackingArea = document.getElementById("trackingGame");
let trackingTimer;
document.getElementById("startTracking").addEventListener("click", () => {
  clearInterval(trackingTimer);
  trackingArea.innerHTML = "";
  const ball = document.createElement("div");
  ball.className = "target";
  ball.style.background = "#ff7a00";
  trackingArea.appendChild(ball);
  let x = 10;
  let y = 10;
  let vx = 2;
  let vy = 1.6;
  trackingTimer = setInterval(() => {
    const w = trackingArea.clientWidth - 24;
    const h = trackingArea.clientHeight - 24;
    x += vx;
    y += vy;
    if (x < 0 || x > w) vx *= -1.05;
    if (y < 0 || y > h) vy *= -1.05;
    x = Math.max(0, Math.min(w, x));
    y = Math.max(0, Math.min(h, y));
    ball.style.left = `${x}px`;
    ball.style.top = `${y}px`;
  }, 16);
});

// Game 3: memory
const icons = ["🍎", "🌟", "🐟", "🚗", "🍎", "🌟", "🐟", "🚗"];
const memoryGame = document.getElementById("memoryGame");
const memoryMovesEl = document.getElementById("memoryMoves");
function shuffle(arr) {
  return arr.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map((i) => i[1]);
}
document.getElementById("startMemory").addEventListener("click", () => {
  let openCards = [];
  let moves = 0;
  memoryMovesEl.textContent = 0;
  memoryGame.innerHTML = "";
  shuffle(icons).forEach((icon) => {
    const card = document.createElement("div");
    card.className = "card";
    card.textContent = icon;
    card.addEventListener("click", () => {
      if (card.classList.contains("open") || card.classList.contains("matched") || openCards.length === 2) return;
      card.classList.add("open");
      openCards.push(card);
      if (openCards.length === 2) {
        moves += 1;
        memoryMovesEl.textContent = moves;
        const [a, b] = openCards;
        if (a.textContent === b.textContent) {
          a.classList.add("matched");
          b.classList.add("matched");
          openCards = [];
        } else {
          setTimeout(() => {
            a.classList.remove("open");
            b.classList.remove("open");
            openCards = [];
          }, 500);
        }
      }
    });
    memoryGame.appendChild(card);
  });
});

// Game 4: dynamic black-white grating
const gratingCanvas = document.getElementById("gratingGame");
const gctx = gratingCanvas.getContext("2d");
const gratingScoreEl = document.getElementById("gratingScore");
let gratingPhase = 0;
let gratingDir = 1;
let gratingTimer;
let gratingScore = 0;

function renderGrating() {
  const { width, height } = gratingCanvas;
  const barWidth = 14;
  gctx.clearRect(0, 0, width, height);
  for (let x = -barWidth; x < width + barWidth; x += barWidth) {
    const shift = ((x + gratingPhase) / barWidth) % 2;
    gctx.fillStyle = Math.floor(Math.abs(shift)) % 2 === 0 ? "#111" : "#fff";
    gctx.fillRect(x, 0, barWidth, height);
  }
  gctx.fillStyle = "#ff3b30";
  gctx.beginPath();
  gctx.arc(width / 2, height / 2, 4, 0, Math.PI * 2);
  gctx.fill();
}

function startGrating() {
  clearInterval(gratingTimer);
  gratingScore = 0;
  gratingScoreEl.textContent = "0";
  gratingDir = Math.random() > 0.5 ? 1 : -1;
  gratingPhase = 0;
  gratingTimer = setInterval(() => {
    gratingPhase += gratingDir * 2.8;
    renderGrating();
  }, 30);
}

function judgeGrating(direction) {
  if (!gratingTimer) return;
  if (direction === gratingDir) gratingScore += 1;
  else gratingScore = Math.max(0, gratingScore - 1);
  gratingScoreEl.textContent = String(gratingScore);
  gratingDir = Math.random() > 0.5 ? 1 : -1;
}

document.getElementById("startGrating").addEventListener("click", startGrating);
document.getElementById("guessLeft").addEventListener("click", () => judgeGrating(-1));
document.getElementById("guessRight").addEventListener("click", () => judgeGrating(1));
renderGrating();

// Game 5: fusion
const fusionRed = document.getElementById("fusionRed");
const fusionBlue = document.getElementById("fusionBlue");
const fusionSlider = document.getElementById("fusionSlider");
const fusionError = document.getElementById("fusionError");
function updateFusion(offset) {
  fusionRed.style.transform = `translateX(${-offset / 2}px)`;
  fusionBlue.style.transform = `translateX(${offset / 2}px)`;
  fusionError.textContent = Math.abs(offset);
}
fusionSlider.addEventListener("input", (e) => updateFusion(Number(e.target.value)));
document.getElementById("resetFusion").addEventListener("click", () => {
  const randomOffset = 20 + Math.floor(Math.random() * 80);
  fusionSlider.value = String(randomOffset);
  updateFusion(randomOffset);
});
updateFusion(Number(fusionSlider.value));

// Game 6: catch
const catchArea = document.getElementById("binocularCatchGame");
const catchHitEl = document.getElementById("catchHit");
const catchRoundEl = document.getElementById("catchRound");
let catchTimer;
function spawnCatchTarget() {
  catchArea.innerHTML = "";
  const target = document.createElement("button");
  target.type = "button";
  target.className = "catch-target";
  const centerX = 20 + Math.random() * 60;
  const centerY = 15 + Math.random() * 65;
  const disparity = 8 + Math.random() * 18;
  target.style.left = `${centerX}%`;
  target.style.top = `${centerY}%`;
  target.style.setProperty("--disp", `${disparity}px`);
  target.addEventListener("click", () => {
    target.dataset.hit = "1";
    target.classList.add("hit");
  });
  catchArea.appendChild(target);
}
document.getElementById("startCatch").addEventListener("click", () => {
  clearInterval(catchTimer);
  let round = 0;
  let hit = 0;
  catchHitEl.textContent = "0";
  catchRoundEl.textContent = "0";
  spawnCatchTarget();
  catchTimer = setInterval(() => {
    const target = catchArea.querySelector(".catch-target");
    if (target?.dataset.hit === "1") hit += 1;
    round += 1;
    catchHitEl.textContent = String(hit);
    catchRoundEl.textContent = String(round);
    if (round >= 12) {
      clearInterval(catchTimer);
      catchArea.innerHTML = `<div class="result">训练结束：命中 ${hit}/12</div>`;
      return;
    }
    spawnCatchTarget();
  }, 1400);
});

// Game 7: tetris-like
const tetrisCanvas = document.getElementById("tetrisGame");
const tetrisCtx = tetrisCanvas.getContext("2d");
const tetrisScoreEl = document.getElementById("tetrisScore");
const tetrisCols = 10;
const tetrisRows = 20;
const cell = 18;
let tetrisBoard = [];
let tetrisPiece;
let tetrisTimer;
let tetrisPaused = false;
let tetrisScore = 0;
const pieces = [[[1,1,1,1]],[[1,1],[1,1]],[[0,1,0],[1,1,1]],[[1,0,0],[1,1,1]],[[0,0,1],[1,1,1]],[[0,1,1],[1,1,0]],[[1,1,0],[0,1,1]]];
const colors = ["#60a5fa", "#34d399", "#fbbf24", "#f87171", "#a78bfa", "#22d3ee", "#f472b6"];
function initTetrisBoard() { tetrisBoard = Array.from({ length: tetrisRows }, () => Array(tetrisCols).fill(0)); }
function newPiece() {
  const i = Math.floor(Math.random() * pieces.length);
  tetrisPiece = { shape: pieces[i].map((row) => [...row]), color: colors[i], x: 3, y: 0 };
}
function drawCell(x, y, color) { tetrisCtx.fillStyle = color; tetrisCtx.fillRect(x * cell, y * cell, cell - 1, cell - 1); }
function drawTetris() {
  tetrisCtx.clearRect(0, 0, tetrisCanvas.width, tetrisCanvas.height);
  for (let y = 0; y < tetrisRows; y += 1) for (let x = 0; x < tetrisCols; x += 1) if (tetrisBoard[y][x]) drawCell(x, y, tetrisBoard[y][x]);
  tetrisPiece?.shape.forEach((row, dy) => row.forEach((v, dx) => { if (v) drawCell(tetrisPiece.x + dx, tetrisPiece.y + dy, tetrisPiece.color); }));
}
function collide(nx, ny, shape = tetrisPiece.shape) {
  for (let y = 0; y < shape.length; y += 1) {
    for (let x = 0; x < shape[y].length; x += 1) {
      if (!shape[y][x]) continue;
      const px = nx + x;
      const py = ny + y;
      if (px < 0 || px >= tetrisCols || py >= tetrisRows) return true;
      if (py >= 0 && tetrisBoard[py][px]) return true;
    }
  }
  return false;
}
function mergePiece() { tetrisPiece.shape.forEach((row, dy) => row.forEach((v, dx) => { if (v && tetrisPiece.y + dy >= 0) tetrisBoard[tetrisPiece.y + dy][tetrisPiece.x + dx] = tetrisPiece.color; })); }
function clearLines() {
  let lines = 0;
  for (let y = tetrisRows - 1; y >= 0; y -= 1) {
    if (tetrisBoard[y].every(Boolean)) { tetrisBoard.splice(y, 1); tetrisBoard.unshift(Array(tetrisCols).fill(0)); lines += 1; y += 1; }
  }
  if (lines) { tetrisScore += lines * lines * 10; tetrisScoreEl.textContent = String(tetrisScore); }
}
function rotatePiece() {
  const rotated = tetrisPiece.shape[0].map((_, i) => tetrisPiece.shape.map((row) => row[i]).reverse());
  if (!collide(tetrisPiece.x, tetrisPiece.y, rotated)) tetrisPiece.shape = rotated;
}
function tetrisStep() {
  if (tetrisPaused || activeScreenId !== "screen-tetris") return;
  if (!collide(tetrisPiece.x, tetrisPiece.y + 1)) tetrisPiece.y += 1;
  else {
    mergePiece();
    clearLines();
    newPiece();
    if (collide(tetrisPiece.x, tetrisPiece.y)) {
      clearInterval(tetrisTimer);
      tetrisCtx.fillStyle = "rgba(0,0,0,0.65)";
      tetrisCtx.fillRect(0, 0, tetrisCanvas.width, tetrisCanvas.height);
      tetrisCtx.fillStyle = "#fff";
      tetrisCtx.font = "bold 22px sans-serif";
      tetrisCtx.fillText("训练结束", 70, 170);
    }
  }
  drawTetris();
}
function startTetris() {
  clearInterval(tetrisTimer);
  initTetrisBoard();
  newPiece();
  tetrisPaused = false;
  tetrisScore = 0;
  tetrisScoreEl.textContent = "0";
  drawTetris();
  tetrisTimer = setInterval(tetrisStep, 420);
}
document.getElementById("startTetris").addEventListener("click", startTetris);
document.getElementById("pauseTetris").addEventListener("click", () => { tetrisPaused = !tetrisPaused; });

document.addEventListener("keydown", (e) => {
  const blockKeys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"];
  if (!modal.classList.contains("hidden") && (blockKeys.includes(e.key) || e.code === "Space")) e.preventDefault();
  if (activeScreenId !== "screen-tetris" || !tetrisPiece) return;
  if (e.key === "ArrowLeft" && !collide(tetrisPiece.x - 1, tetrisPiece.y)) tetrisPiece.x -= 1;
  if (e.key === "ArrowRight" && !collide(tetrisPiece.x + 1, tetrisPiece.y)) tetrisPiece.x += 1;
  if (e.key === "ArrowDown" && !collide(tetrisPiece.x, tetrisPiece.y + 1)) tetrisPiece.y += 1;
  if (e.key === "ArrowUp") rotatePiece();
  if (e.code === "Space") {
    while (!collide(tetrisPiece.x, tetrisPiece.y + 1)) tetrisPiece.y += 1;
    tetrisStep();
  }
  drawTetris();
});

loadTasks();
loadStats();
