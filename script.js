// ==========================================
// Telegram WebApp Initialization
// ==========================================
if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
}

// ==========================================
// Passcode & Story Configuration
// ==========================================
const PASSWORD = "2309"; // Set to your starting anniversary date (DD MM)
let enteredCode = "";

const screens = document.querySelectorAll("section");
const boxes = document.querySelectorAll(".passcode-slots .box");
const keyButtons = document.querySelectorAll(".key-btn");
const tryAgainBtn = document.getElementById("tryAgainBtn");
const giftBox = document.getElementById("giftBox");
const openGiftBtn = document.getElementById("openGiftBtn");

const bgMusic = document.getElementById("bgMusic");
const keypadSound = document.getElementById("keypadSound");
const btnClickSound = document.getElementById("btnClickSound");
const giftPopSound = document.getElementById("giftPopSound");
const musicToggle = document.getElementById("musicToggle");
const equalizer = document.getElementById("equalizer");

function playSound(audioEl) {
    if (audioEl) {
        audioEl.currentTime = 0;
        audioEl.play().catch(() => {});
    }
}

function showScreen(screenId) {
    screens.forEach(screen => screen.classList.add("hidden"));
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.remove("hidden");
    }
}

// --------------------------
// Passcode Logic
// --------------------------
function updateBoxes() {
    boxes.forEach((box, index) => {
        if (index < enteredCode.length) {
            box.textContent = "♥";
            box.classList.add("filled");
        } else {
            box.textContent = "";
            box.classList.remove("filled");
        }
    });
}

function addDigit(digit) {
    if (enteredCode.length >= 4) return;
    playSound(keypadSound);
    enteredCode += digit;
    updateBoxes();

    if (enteredCode.length === 4) {
        setTimeout(checkPassword, 250);
    }
}

function removeDigit() {
    if (enteredCode.length === 0) return;
    playSound(keypadSound);
    enteredCode = enteredCode.slice(0, -1);
    updateBoxes();
}

function checkPassword() {
    if (enteredCode === PASSWORD) {
        triggerConfetti();
        showScreen("gift-screen");
    } else {
        showScreen("error-screen");
    }
}

function resetPasscode() {
    enteredCode = "";
    updateBoxes();
    showScreen("passcode-screen");
}

// --------------------------
// Keypad & Audio Listeners
// --------------------------
keyButtons.forEach(button => {
    button.addEventListener("click", () => {
        const val = button.textContent.trim();
        if (val === "⌫") removeDigit();
        else if (val === "UNLOCK") {
            playSound(keypadSound);
            if (enteredCode.length === 4) checkPassword();
        } else {
            addDigit(val);
        }
    });
});

document.addEventListener("keydown", (e) => {
    if (e.key >= "0" && e.key <= "9") addDigit(e.key);
    else if (e.key === "Backspace") removeDigit();
    else if (e.key === "Enter" && enteredCode.length === 4) checkPassword();
});

if (musicToggle && bgMusic) {
    musicToggle.addEventListener("click", () => {
        playSound(btnClickSound);
        if (bgMusic.paused) {
            bgMusic.play();
            musicToggle.textContent = "❚❚";
            if (equalizer) equalizer.classList.add("playing");
        } else {
            bgMusic.pause();
            musicToggle.textContent = "▶";
            if (equalizer) equalizer.classList.remove("playing");
        }
    });
}

// --------------------------
// Navigation Handlers
// --------------------------
tryAgainBtn.addEventListener("click", () => {
    playSound(btnClickSound);
    resetPasscode();
});

giftBox.addEventListener("click", () => {
    playSound(giftPopSound);
    document.querySelector(".gift-animated").textContent = "💖";
    triggerConfetti();
});

openGiftBtn.addEventListener("click", () => {
    playSound(btnClickSound);
    showScreen("welcome-screen");
});

document.getElementById("startJourneyBtn").addEventListener("click", () => {
    playSound(btnClickSound);
    showScreen("calendar-screen");
});

document.getElementById("calendarNextBtn").addEventListener("click", () => {
    playSound(btnClickSound);
    showScreen("map-screen");
});

document.getElementById("mapNextBtn").addEventListener("click", () => {
    playSound(btnClickSound);
    showScreen("firsts-screen");
});

document.getElementById("firstsNextBtn").addEventListener("click", () => {
    playSound(btnClickSound);
    showScreen("memories-screen");
});

document.getElementById("memoriesNextBtn").addEventListener("click", () => {
    playSound(btnClickSound);
    showScreen("gallery-screen");
});

document.getElementById("galleryNextBtn").addEventListener("click", () => {
    playSound(btnClickSound);
    showScreen("letter-screen");
});

document.getElementById("letterNextBtn").addEventListener("click", () => {
    playSound(btnClickSound);
    triggerConfetti();
    showScreen("ending-screen");
});

document.getElementById("restartBtn").addEventListener("click", () => {
    playSound(btnClickSound);
    if (bgMusic) {
        bgMusic.pause();
        bgMusic.currentTime = 0;
        musicToggle.textContent = "▶";
        if (equalizer) equalizer.classList.remove("playing");
    }
    resetPasscode();
});

// Floating hearts background
function initFloatingHearts() {
    const bg = document.getElementById("heart-bg");
    if (!bg) return;
    setInterval(() => {
        const heart = document.createElement("div");
        heart.classList.add("floating-heart");
        heart.innerHTML = "❤️";
        heart.style.left = Math.random() * 100 + "vw";
        heart.style.animationDuration = (Math.random() * 3 + 5) + "s";
        heart.style.fontSize = (Math.random() * 12 + 12) + "px";
        bg.appendChild(heart);
        setTimeout(() => heart.remove(), 8000);
    }, 700);
}
initFloatingHearts();

function triggerConfetti() {
    if (typeof confetti === "function") {
        confetti({
            particleCount: 75,
            spread: 60,
            origin: { y: 0.6 }
        });
    }
}