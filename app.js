const logSeed = [
  ["10:15:30", "เชื่อมต่อแหล่งข้อมูล: https://example.com/stream"],
  ["10:15:31", "โหลดโมเดล AI สำเร็จ"],
  ["10:15:32", "เริ่มการประมวลผลวิดีโอ"],
  ["10:15:35", "ตรวจพบ AMV <strong>(Confidence: 0.92)</strong>"],
  ["10:15:36", "ตรวจพบ LMV <strong>(Confidence: 0.88)</strong>"],
  ["10:15:37", "ตรวจพบ AMV <strong>(Confidence: 0.95)</strong>"],
  ["10:15:40", "ตรวจพบ AFV <strong>(Confidence: 0.90)</strong>"]
];

const generatedEvents = [
  "ตรวจพบ MCV <strong>(Confidence: 0.87)</strong>",
  "ตรวจพบ CV <strong>(Confidence: 0.91)</strong>",
  "อัปเดตกรอบตรวจจับบนภาพ Live",
  "สร้าง Snapshot อัตโนมัติ",
  "ตรวจพบ AMV <strong>(Confidence: 0.94)</strong>"
];

const snapshotTypes = ["AMV", "LMV", "AFV", "AMV", "CV", "MCV"];

const logRows = document.querySelector("#logRows");
const snapshots = document.querySelector("#snapshots");
const startBtn = document.querySelector("#startBtn");
const transportPlay = document.querySelector("#transportPlay");
const connectBtn = document.querySelector("#connectBtn");
const connectionText = document.querySelector("#connectionText");
const targetGrid = document.querySelector("#targetGrid");
const clock = document.querySelector("#clock");

function moveSetupPanelToSidebar() {
  const appShell = document.querySelector(".app-shell");
  const sidebar = document.querySelector(".sidebar");
  const topbar = document.querySelector(".topbar");
  const sidebarBrand = document.querySelector(".sidebar-brand");
  const setupGrid = document.querySelector(".setup-grid");

  if (appShell && topbar && topbar.parentElement !== appShell) {
    appShell.prepend(topbar);
  }

  if (topbar && sidebarBrand && !topbar.contains(sidebarBrand)) {
    topbar.prepend(sidebarBrand);
  }

  if (sidebarBrand) {
    sidebarBrand.remove();
  }

  if (!sidebar || !setupGrid || sidebar.contains(setupGrid)) return;
  sidebar.appendChild(setupGrid);
}

moveSetupPanelToSidebar();

let running = false;
let logIndex = 0;
let timer = null;

function renderLogs(rows) {
  logRows.innerHTML = rows.map(([time, message]) => `
    <div class="log-row" role="row">
      <span role="cell">${time}</span>
      <span role="cell">${message}</span>
    </div>
  `).join("");
}

function renderSnapshots() {
  snapshots.innerHTML = snapshotTypes.map((type, index) => `
    <div class="snapshot">
      <img src="assets/surveillance-road.png" alt="Snapshot ${type}" />
      <span>${type}</span>
      <time>00:00:${String(index * 10).padStart(2, "0")}</time>
    </div>
  `).join("");
}

function updateClock() {
  const now = new Date();
  clock.textContent = now.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
}

function tickDetection() {
  const now = new Date();
  const time = now.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });

  const nextMessage = generatedEvents[logIndex % generatedEvents.length];
  logSeed.unshift([time, nextMessage]);
  renderLogs(logSeed.slice(0, 9));
  logIndex += 1;

  const metrics = [...document.querySelectorAll("[data-count]")];
  const target = metrics[logIndex % metrics.length];
  const nextValue = Number(target.dataset.count) + 1;
  target.dataset.count = String(nextValue);
  target.textContent = String(nextValue);

  const total = document.querySelector("#totalCount");
  total.textContent = String(Number(total.textContent) + 1);
}

function setRunning(next) {
  running = next;
  startBtn.querySelector("strong").textContent = running ? "กำลังตรวจจับ" : "เริ่มตรวจจับ";
  startBtn.classList.toggle("is-running", running);

  if (running) {
    tickDetection();
    timer = window.setInterval(tickDetection, 2200);
  } else {
    window.clearInterval(timer);
  }
}

connectBtn.addEventListener("click", () => {
  connectionText.textContent = "เชื่อมต่อสำเร็จ";
  connectBtn.textContent = "เชื่อมต่อแล้ว";
  window.setTimeout(() => {
    connectBtn.textContent = "เชื่อมต่อ";
  }, 1400);
});

startBtn.addEventListener("click", () => setRunning(!running));
transportPlay.addEventListener("click", () => setRunning(!running));

targetGrid.addEventListener("click", (event) => {
  const chip = event.target.closest(".target-chip");
  if (!chip) return;

  document.querySelectorAll(".target-chip").forEach((item) => item.classList.remove("is-selected"));
  chip.classList.add("is-selected");
});

renderLogs(logSeed);
renderSnapshots();
updateClock();
window.setInterval(updateClock, 1000);
