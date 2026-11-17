// Chance Cabinet — all randomness uses the Web Crypto API.
const $ = (id) => document.getElementById(id);

function randInt(min, max) {
  // Inclusive, unbiased integer in [min, max]
  const range = max - min + 1;
  const limit = Math.floor(0x100000000 / range) * range;
  const buf = new Uint32Array(1);
  do { crypto.getRandomValues(buf); } while (buf[0] >= limit);
  return min + (buf[0] % range);
}
const pick = (arr) => arr[randInt(0, arr.length - 1)];

function shake(id) {
  const el = $(id);
  el.classList.remove("shake");
  void el.offsetWidth;
  el.classList.add("shake");
}

function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("show"), 1600);
}

// 01 Dice
function rollDice() {
  const count = Math.min(6, Math.max(1, parseInt($("dice-count").value, 10) || 1));
  const sides = parseInt($("dice-sides").value, 10);
  const row = $("dice-row");
  row.innerHTML = "";
  let total = 0;
  for (let i = 0; i < count; i++) {
    const v = randInt(1, sides);
    total += v;
    const d = document.createElement("div");
    d.className = "die rolling";
    d.textContent = v;
    row.appendChild(d);
  }
  $("dice-total").textContent = `Total: ${total}  (${count}d${sides})`;
}

// 02 Coin
const tally = { heads: 0, tails: 0 };
function flipCoin() {
  const coin = $("coin-face");
  const side = randInt(0, 1) ? "heads" : "tails";
  coin.classList.remove("flipping");
  void coin.offsetWidth;
  coin.classList.add("flipping");
  coin.textContent = "";
  setTimeout(() => { coin.textContent = side; }, 350);
  tally[side]++;
  $("coin-tally").textContent = `Heads ${tally.heads} · Tails ${tally.tails}`;
}

// 03 Palette
function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return "#" + [f(0), f(8), f(4)].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("");
}
function drawPalette() {
  const base = randInt(0, 359);
  const step = pick([18, 30, 72, 137]);
  const wrap = $("swatches");
  wrap.innerHTML = "";
  for (let i = 0; i < 5; i++) {
    const l = randInt(28, 80);
    const hex = hslToHex((base + i * step) % 360, randInt(45, 85), l);
    const s = document.createElement("button");
    s.className = "swatch";
    s.style.background = hex;
    s.style.color = l > 58 ? "#1d1a16" : "#f3ecdf";
    s.textContent = hex.toUpperCase();
    s.title = "Copy " + hex;
    s.addEventListener("click", () => {
      navigator.clipboard?.writeText(hex.toUpperCase()).then(
        () => toast(`Copied ${hex.toUpperCase()}`),
        () => toast(hex.toUpperCase())
      );
    });
    wrap.appendChild(s);
  }
}

// 04 Number
function pickNumber() {
  let a = parseInt($("num-min").value, 10);
  let b = parseInt($("num-max").value, 10);
  if (Number.isNaN(a)) a = 1;
  if (Number.isNaN(b)) b = 100;
  if (a > b) [a, b] = [b, a];
  $("number-out").textContent = randInt(a, b);
}

// 05 Decider
function decide() {
  const options = $("choices").value.split("\n").map((s) => s.trim()).filter(Boolean);
  const out = $("verdict");
  if (!options.length) { out.textContent = "Give fate something to work with."; return; }
  let n = 0;
  const spins = 12;
  const timer = setInterval(() => {
    out.textContent = pick(options);
    if (++n >= spins) {
      clearInterval(timer);
      out.textContent = "→ " + pick(options);
    }
  }, 60);
}

// 06 Oddity
const who = ["A retired lighthouse keeper", "A very polite raccoon", "Your future self", "A librarian on roller skates", "A sentient houseplant", "Two rival pigeons", "A time-traveling baker", "The moon's understudy"];
const what = ["opens a museum of", "writes a love letter to", "starts a podcast about", "smuggles", "accidentally invents", "holds a trial for", "teaches a masterclass in", "loses a bet involving"];
const thing = ["lost umbrellas", "Tuesday afternoons", "the last unmatched sock", "a jar of thunder", "forgotten passwords", "an extremely loud teaspoon", "the color nobody has named", "a map to nowhere in particular"];
const where = ["at 3 a.m.", "inside a snow globe", "during a solar eclipse", "on a slow train to the coast", "in an elevator stuck between floors", "at a very quiet karaoke bar", "underneath the city", "while it rains upward"];
function oddity() {
  $("prompt-out").textContent = `${pick(who)} ${pick(what)} ${pick(thing)} ${pick(where)}.`;
}

const actions = { dice: rollDice, coin: flipCoin, palette: drawPalette, number: pickNumber, decide, prompt: oddity };

document.querySelectorAll("[data-roll]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.roll;
    actions[key]();
    shake(key);
  });
});

function shakeAll() {
  Object.entries(actions).forEach(([key, fn], i) => setTimeout(() => { fn(); shake(key); }, i * 70));
}
$("shake-all").addEventListener("click", shakeAll);

document.addEventListener("keydown", (e) => {
  const tag = e.target.tagName;
  if (e.code === "Space" && !["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(tag)) {
    e.preventDefault();
    shakeAll();
  }
});

// Initial state
rollDice();
drawPalette();
oddity();
