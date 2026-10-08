"use strict";

const root = document.documentElement;
const themeColor = document.querySelector('meta[name="theme-color"]');
const themeButtons = document.querySelectorAll(".theme-toggle");
const progressBar = document.querySelector(".scroll-progress span");
const projectDialog = document.querySelector(".project-dialog");
const offlineDialog = document.querySelector(".offline-screen");
const toast = document.querySelector(".online-toast");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function readSavedTheme() {
  try {
    return window.localStorage.getItem("portfolio-theme");
  } catch (error) {
    console.warn("The saved theme could not be read.", error);
    return null;
  }
}

function saveTheme(theme) {
  try {
    window.localStorage.setItem("portfolio-theme", theme);
  } catch (error) {
    console.warn("The selected theme could not be saved.", error);
  }
}

function setTheme(theme, persist) {
  root.dataset.theme = theme;
  if (themeColor) {
    themeColor.content = getComputedStyle(root).getPropertyValue("--paper").trim();
  }
  themeButtons.forEach((button) => {
    button.textContent = theme === "dark" ? "Light" : "Dark";
    button.setAttribute("aria-label", `Switch to ${theme === "dark" ? "light" : "dark"} theme`);
    button.setAttribute("aria-pressed", String(theme === "dark"));
  });
  if (persist) saveTheme(theme);
}

const savedTheme = readSavedTheme();
if (savedTheme === "light" || savedTheme === "dark") setTheme(savedTheme, false);
else if (window.matchMedia("(prefers-color-scheme: dark)").matches) setTheme("dark", false);
else setTheme("light", false);

themeButtons.forEach((button) => button.addEventListener("click", () => {
  setTheme(root.dataset.theme === "dark" ? "light" : "dark", true);
}));

function updateProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const amount = scrollable > 0 ? window.scrollY / scrollable : 0;
  if (progressBar) progressBar.style.transform = `scaleX(${Math.min(1, Math.max(0, amount))})`;
}

window.addEventListener("scroll", updateProgress, { passive: true });
window.addEventListener("resize", updateProgress, { passive: true });
updateProgress();

if (!reducedMotion && "IntersectionObserver" in window) {
  const revealItems = document.querySelectorAll(
    ".section-heading, .section-label, .section-copy, .service-card, .skill-group, .featured-project, .project-card, .timeline-item, .why-copy, .strength-grid article, .training-card, .contact-grid a",
  );
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -30px 0px" });

  document.body.classList.add("motion-ready");
  revealItems.forEach((element, index) => {
    element.dataset.reveal = "";
    element.style.setProperty("--reveal-index", String(index % 5));
    observer.observe(element);
  });
}

const projectDetailsDialog = {
  title: document.querySelector("[data-detail-title]"),
  number: document.querySelector("[data-detail-number]"),
  content: document.querySelector("[data-detail-content]"),
};
const closeProjectButton = document.querySelector(".project-dialog .dialog-close");

function appendTextSection(container, heading, text) {
  if (!text) return;
  const section = document.createElement("section");
  const title = document.createElement("h3");
  const paragraph = document.createElement("p");
  title.textContent = heading;
  paragraph.textContent = text;
  section.append(title, paragraph);
  container.append(section);
}

function appendListSection(container, heading, sourceList) {
  if (!sourceList) return;
  const section = document.createElement("section");
  const title = document.createElement("h3");
  title.textContent = heading;
  const list = sourceList.cloneNode(true);
  list.querySelectorAll(".project-open").forEach((button) => button.remove());
  section.append(title, list);
  container.append(section);
}

function showProjectDetails(article) {
  const title = article.querySelector("h3")?.innerText?.replace(/\s+/g, " ").trim() || "Project";
  const number = article.querySelector(".project-number")?.textContent?.trim()
    || article.dataset.project
    || "";
  const summary = article.querySelector(".project-summary")?.textContent?.trim()
    || article.querySelector(":scope > p")?.textContent?.trim()
    || "";

  projectDetailsDialog.title.textContent = title;
  projectDetailsDialog.number.textContent = number;
  projectDetailsDialog.content.replaceChildren();

  appendTextSection(projectDetailsDialog.content, "Overview", summary);

  const architecture = article.querySelector(".architecture");
  if (architecture) {
    const diagram = document.createElement("section");
    const heading = document.createElement("h3");
    const clonedDiagram = architecture.cloneNode(true);
    heading.textContent = "Architecture";
    diagram.append(heading, clonedDiagram);
    projectDetailsDialog.content.append(diagram);
    appendTextSection(
      projectDetailsDialog.content,
      "Architecture note",
      article.querySelector(".architecture-note")?.textContent?.trim(),
    );
  }

  const details = article.querySelector(".project-details");
  if (details) {
    details.querySelectorAll(":scope > div").forEach((group) => {
      appendListSection(
        projectDetailsDialog.content,
        group.querySelector("h4")?.textContent?.trim() || "Project details",
        group.querySelector(".check-list"),
      );
    });
  } else {
    appendListSection(
      projectDetailsDialog.content,
      article.querySelector("h4")?.textContent?.trim() || "Project focus",
      article.querySelector(".check-list"),
    );
  }

  appendTextSection(
    projectDetailsDialog.content,
    article.querySelector(".learning-note h4")?.textContent?.trim() || "Project context",
    article.querySelector(".learning-note p")?.textContent?.trim()
      || article.querySelector(".next-stage")?.textContent?.trim()
      || "Practical work documented as I learn.",
  );

  const meta = document.createElement("div");
  meta.className = "dialog-meta";
  const role = document.createElement("p");
  const roleLabel = document.createElement("strong");
  roleLabel.textContent = "Role";
  role.append(roleLabel, document.createElement("br"), document.createTextNode("The project description does not specify a formal project role."));

  const tools = document.createElement("p");
  const toolsLabel = document.createElement("strong");
  toolsLabel.textContent = "Tools";
  const technologyLine = article.querySelector(".tech-line span");
  const projectTools = technologyLine?.textContent?.trim()
    || Array.from(article.querySelectorAll(".check-list li"), (item) => item.textContent.trim()).join(" · ");
  tools.append(toolsLabel, document.createElement("br"), document.createTextNode(projectTools || "See project focus above."));
  meta.append(role, tools);
  projectDetailsDialog.content.append(meta);

  const links = document.createElement("div");
  links.className = "dialog-links";
  const linksTitle = document.createElement("h3");
  linksTitle.textContent = "Project links";
  const liveLink = document.createElement("p");
  const repositoryLink = document.createElement("p");
  liveLink.textContent = "Live demo: not provided.";
  repositoryLink.textContent = "Repository: not provided.";
  links.append(linksTitle, liveLink, repositoryLink);
  projectDetailsDialog.content.append(links);

  if (!projectDialog.open) projectDialog.showModal();
}

document.querySelectorAll("[data-project]").forEach((article) => {
  const projectTitle = article.querySelector("h3")?.innerText?.replace(/\s+/g, " ").trim() || "project";
  article.tabIndex = 0;
  article.setAttribute("aria-label", `Open project details: ${projectTitle}`);
  const button = document.createElement("button");
  button.className = "project-open";
  button.type = "button";
  button.append(document.createTextNode("Explore project "));
  const arrow = document.createElement("span");
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "↗";
  button.append(arrow);
  button.addEventListener("click", () => showProjectDetails(article));
  article.append(button);
  article.addEventListener("click", (event) => {
    if (event.target.closest("button, a")) return;
    showProjectDetails(article);
  });
  article.addEventListener("keydown", (event) => {
    if (event.target !== article || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    showProjectDetails(article);
  });
});

closeProjectButton?.addEventListener("click", () => projectDialog.close());
projectDialog?.addEventListener("click", (event) => {
  if (event.target === projectDialog) projectDialog.close();
});

const projectShell = projectDialog?.querySelector(".dialog-shell");
let projectTouchStart = 0;
projectShell?.addEventListener("touchstart", (event) => {
  projectTouchStart = event.changedTouches[0]?.clientY || 0;
}, { passive: true });
projectShell?.addEventListener("touchend", (event) => {
  const end = event.changedTouches[0]?.clientY || 0;
  if (projectShell.scrollTop <= 0 && end - projectTouchStart > 120) projectDialog.close();
}, { passive: true });

const offlineCanvas = document.querySelector(".runner-canvas");
const context = offlineCanvas?.getContext("2d");
const scoreOutput = document.querySelector("[data-score]");
const highScoreOutput = document.querySelector("[data-high-score]");
const startButton = document.querySelector(".game-start");
const restartButton = document.querySelector(".game-restart");
const offlineCloseButton = document.querySelector(".offline-close");
const continueButton = document.querySelector(".offline-continue");
const game = {
  active: false,
  over: false,
  frame: 0,
  lastTime: 0,
  width: 0,
  height: 0,
  ratio: 1,
  elapsed: 0,
  score: 0,
  highScore: 0,
  speed: 260,
  nextObstacle: 1.2,
  obstacles: [],
  player: { x: 58, y: 0, width: 25, height: 31, velocity: 0, jumping: false },
};

function readHighScore() {
  try {
    const value = Number(window.localStorage.getItem("portfolio-runner-high-score"));
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch (error) {
    console.warn("The runner's high score could not be read.", error);
    return 0;
  }
}

function storeHighScore(value) {
  try {
    window.localStorage.setItem("portfolio-runner-high-score", String(value));
  } catch (error) {
    console.warn("The runner's high score could not be saved.", error);
  }
}

game.highScore = readHighScore();
if (highScoreOutput) highScoreOutput.textContent = String(game.highScore).padStart(5, "0");

function updateScore() {
  if (scoreOutput) scoreOutput.textContent = String(Math.floor(game.score)).padStart(5, "0");
  if (highScoreOutput) highScoreOutput.textContent = String(game.highScore).padStart(5, "0");
}

function resizeGame() {
  if (!offlineCanvas || !context) return;
  const rect = offlineCanvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  game.width = rect.width;
  game.height = rect.height;
  game.ratio = Math.min(window.devicePixelRatio || 1, 2);
  offlineCanvas.width = Math.round(game.width * game.ratio);
  offlineCanvas.height = Math.round(game.height * game.ratio);
  context.setTransform(game.ratio, 0, 0, game.ratio, 0, 0);
  game.player.x = Math.max(34, game.width * 0.075);
  if (!game.active) drawGame();
}

function drawGame() {
  if (!context || !game.width || !game.height) return;
  const { width, height } = game;
  const floor = height - 26;
  const colors = getComputedStyle(root);
  const ink = colors.getPropertyValue("--ink").trim();
  const muted = colors.getPropertyValue("--muted").trim();
  const accent = colors.getPropertyValue("--accent").trim();
  const panel = colors.getPropertyValue("--paper-deep").trim();
  const player = game.player;

  context.clearRect(0, 0, width, height);
  context.fillStyle = panel;
  context.fillRect(0, 0, width, height);
  context.strokeStyle = muted;
  context.globalAlpha = 0.35;
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(0, floor + 0.5);
  context.lineTo(width, floor + 0.5);
  context.stroke();
  context.globalAlpha = 1;

  for (let index = 0; index < 7; index += 1) {
    const x = ((index * 173 - game.elapsed * game.speed * 0.16) % (width + 80) + width + 80) % (width + 80);
    context.globalAlpha = 0.28;
    context.fillStyle = muted;
    context.fillRect(x, height * 0.24 + (index % 3) * 13, 2, 2);
  }
  context.globalAlpha = 1;

  const playerY = player.y || floor - player.height;
  context.fillStyle = ink;
  context.fillRect(player.x, playerY, player.width, player.height);
  context.fillStyle = accent;
  context.fillRect(player.x + 5, playerY + 6, player.width - 10, 3);
  context.fillRect(player.x + 5, playerY + 13, player.width - 10, 3);
  context.fillRect(player.x + 5, playerY + 20, player.width - 10, 3);
  context.fillRect(player.x + 4, playerY + player.height, 6, 3);
  context.fillRect(player.x + 17, playerY + player.height, 6, 3);

  game.obstacles.forEach((obstacle) => {
    context.fillStyle = ink;
    context.fillRect(obstacle.x, floor - obstacle.height, obstacle.width, obstacle.height);
    context.fillStyle = accent;
    context.fillRect(obstacle.x + 4, floor - obstacle.height + 6, obstacle.width - 8, 3);
    if (obstacle.height > 30) context.fillRect(obstacle.x + 4, floor - obstacle.height + 14, obstacle.width - 8, 3);
  });

  if (game.over) {
    context.fillStyle = ink;
    context.font = "700 12px 'DM Mono', monospace";
    context.textAlign = "center";
    context.fillText("RUN COMPLETE — TRY AGAIN", width / 2, Math.max(25, height * 0.35));
  }
}

function jump() {
  if (!game.active) {
    startGame();
    return;
  }
  if (game.over || game.player.jumping) return;
  game.player.velocity = -Math.max(360, game.height * 2);
  game.player.jumping = true;
}

function endGame() {
  game.active = false;
  game.over = true;
  window.cancelAnimationFrame(game.frame);
  const finalScore = Math.floor(game.score);
  if (finalScore > game.highScore) {
    game.highScore = finalScore;
    storeHighScore(finalScore);
  }
  updateScore();
  if (startButton) startButton.hidden = true;
  if (restartButton) restartButton.hidden = false;
  drawGame();
}

function updateGame(timestamp) {
  if (!game.active) return;
  const delta = Math.min((timestamp - game.lastTime) / 1000, 0.034);
  game.lastTime = timestamp;
  game.elapsed += delta;
  game.score += delta * game.speed * 0.045;
  game.speed = Math.min(620, 260 + game.score * 0.18);

  const floor = game.height - 26;
  const player = game.player;
  if (player.jumping) {
    player.velocity += 1280 * delta;
    player.y += player.velocity * delta;
    if (player.y >= floor - player.height) {
      player.y = floor - player.height;
      player.velocity = 0;
      player.jumping = false;
    }
  } else {
    player.y = floor - player.height;
  }

  game.nextObstacle -= delta;
  if (game.nextObstacle <= 0) {
    const height = 22 + Math.random() * Math.min(24, 16 + game.score / 80);
    const width = 18 + Math.random() * 12;
    game.obstacles.push({ x: game.width + 8, width, height });
    game.nextObstacle = 0.95 + Math.random() * 0.9;
  }

  game.obstacles = game.obstacles.filter((obstacle) => obstacle.x + obstacle.width > 0);
  for (const obstacle of game.obstacles) {
    obstacle.x -= game.speed * delta;
    const overlaps = player.x + player.width - 4 > obstacle.x + 3
      && player.x + 4 < obstacle.x + obstacle.width - 3
      && player.y + player.height - 3 > floor - obstacle.height + 3;
    if (overlaps) {
      endGame();
      return;
    }
  }

  updateScore();
  drawGame();
  game.frame = window.requestAnimationFrame(updateGame);
}

function startGame() {
  resizeGame();
  game.active = true;
  game.over = false;
  game.elapsed = 0;
  game.score = 0;
  game.speed = 260;
  game.nextObstacle = 1;
  game.obstacles = [];
  game.player.y = game.height - 26 - game.player.height;
  game.player.velocity = 0;
  game.player.jumping = false;
  game.lastTime = performance.now();
  if (startButton) startButton.hidden = true;
  if (restartButton) restartButton.hidden = true;
  updateScore();
  game.frame = window.requestAnimationFrame(updateGame);
}

function stopGame() {
  game.active = false;
  window.cancelAnimationFrame(game.frame);
  drawGame();
  if (startButton) startButton.hidden = false;
  if (restartButton) restartButton.hidden = true;
}

function openOfflineGame(isConnectionLoss) {
  offlineDialog.dataset.connectionLoss = String(isConnectionLoss);
  if (!offlineDialog.open) offlineDialog.showModal();
  resizeGame();
  if (isConnectionLoss) startGame();
}

function closeOfflineGame() {
  if (offlineDialog.open) offlineDialog.close();
  stopGame();
}

startButton?.addEventListener("click", startGame);
restartButton?.addEventListener("click", startGame);
offlineCanvas?.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  jump();
});
offlineCloseButton?.addEventListener("click", closeOfflineGame);
continueButton?.addEventListener("click", closeOfflineGame);
offlineDialog?.addEventListener("click", (event) => {
  if (event.target === offlineDialog) closeOfflineGame();
});
offlineDialog?.addEventListener("close", stopGame);

document.addEventListener("keydown", (event) => {
  if ((event.code === "Space" || event.code === "ArrowUp") && offlineDialog?.open) {
    event.preventDefault();
    jump();
  }
});

window.addEventListener("resize", resizeGame, { passive: true });
document.addEventListener("visibilitychange", () => {
  if (document.hidden && game.active) {
    window.cancelAnimationFrame(game.frame);
    game.active = false;
    if (startButton) startButton.hidden = false;
  }
});

const wordmark = document.querySelector(".wordmark");
let logoTaps = 0;
let logoTapTimer = 0;
function registerLogoTap() {
  logoTaps += 1;
  window.clearTimeout(logoTapTimer);
  logoTapTimer = window.setTimeout(() => { logoTaps = 0; }, 1800);
  if (logoTaps >= 5) {
    logoTaps = 0;
    openOfflineGame(false);
  }
}

wordmark?.addEventListener("click", registerLogoTap);
document.querySelectorAll("[data-open-game]").forEach((button) => {
  button.addEventListener("click", () => openOfflineGame(false));
});

const customCursor = document.querySelector(".cursor-mark");
if (customCursor && window.matchMedia("(pointer: fine) and (min-width: 681px)").matches) {
  let pointerFrame = 0;
  document.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse") return;
    window.cancelAnimationFrame(pointerFrame);
    pointerFrame = window.requestAnimationFrame(() => {
      customCursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -50%)`;
      customCursor.classList.add("is-visible");
    });
  }, { passive: true });
  document.addEventListener("pointerover", (event) => {
    if (event.target.closest("a, button")) customCursor.classList.add("is-hovering");
    else customCursor.classList.remove("is-hovering");
  });
  document.addEventListener("pointerleave", () => customCursor.classList.remove("is-visible"));
}

document.addEventListener("pointerdown", (event) => {
  const target = event.target.closest("a, button, .project-card, .service-card");
  if (!target) return;
  target.classList.remove("tap-feedback");
  window.requestAnimationFrame(() => target.classList.add("tap-feedback"));
  window.setTimeout(() => target.classList.remove("tap-feedback"), 220);
});

let toastTimer = 0;
function showOnlineToast() {
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 3200);
}

window.addEventListener("offline", () => openOfflineGame(true));
window.addEventListener("online", () => {
  if (offlineDialog.dataset.connectionLoss === "true") closeOfflineGame();
  offlineDialog.dataset.connectionLoss = "false";
  showOnlineToast();
});

if (!navigator.onLine) openOfflineGame(true);
resizeGame();

if (window.isSecureContext && "serviceWorker" in navigator && /^https?:$/.test(window.location.protocol)) {
  navigator.serviceWorker.register("./sw.js").catch((error) => {
    console.error("The offline service worker could not be registered.", error);
  });
}
