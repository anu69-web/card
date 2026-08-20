// ==========================================
// Telegram WebApp Initialization & Safe Config
// ==========================================
if (window.Telegram && window.Telegram.WebApp) {
    try {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
        window.Telegram.WebApp.enableClosingConfirmation?.();
    } catch (e) {
        console.warn("Telegram WebApp init notice:", e);
    }
}

// ==========================================
// Passcode & Story Configuration
// ==========================================
const PASSWORD = "2309"; // 23 September (DDMM)
let enteredCode = "";

const screens = document.querySelectorAll("section");
const boxes = document.querySelectorAll(".passcode-slots .box");
const keyButtons = document.querySelectorAll(".key-btn");
const tryAgainBtn = document.getElementById("tryAgainBtn");
const giftBox = document.getElementById("giftBox");
const openGiftBtn = document.getElementById("openGiftBtn");

const bgMusic = document.getElementById("bgMusic");
const keypadSound = document.getElementById("keypadSound");
const giftPopSound = document.getElementById("giftPopSound");

const musicToggle = document.getElementById("musicToggle");
const floatingMusicToggle = document.getElementById("floatingMusicToggle");
const equalizer = document.getElementById("equalizer");
const miniEqualizer = document.getElementById("miniEqualizer");
const globalMusicBar = document.getElementById("global-music-bar");

// ------------------------------------------
// Haptic & Sound Effects (Resilient)
// ------------------------------------------
function triggerHaptic(type = "light") {
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
        try {
            if (type === "success") window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
            else if (type === "error") window.Telegram.WebApp.HapticFeedback.notificationOccurred("error");
            else window.Telegram.WebApp.HapticFeedback.impactOccurred(type);
        } catch (e) {}
    }
}

function playSound(audioEl) {
    if (audioEl) {
        try {
            audioEl.currentTime = 0;
            audioEl.play().catch(() => {});
        } catch (e) {}
    }
}

// ------------------------------------------
// Music Sync Management
// ------------------------------------------
let isMusicPlaying = false;

function setMusicState(playing) {
    if (!bgMusic) return;
    
    if (playing) {
        bgMusic.play().then(() => {
            isMusicPlaying = true;
            if (musicToggle) musicToggle.textContent = "❚❚";
            if (equalizer) equalizer.classList.add("playing");
            if (miniEqualizer) miniEqualizer.classList.add("playing");
            if (globalMusicBar) globalMusicBar.classList.remove("hidden");
        }).catch(err => {
            console.log("Audio autoplay restricted:", err);
            isMusicPlaying = false;
        });
    } else {
        bgMusic.pause();
        isMusicPlaying = false;
        if (musicToggle) musicToggle.textContent = "▶";
        if (equalizer) equalizer.classList.remove("playing");
        if (miniEqualizer) miniEqualizer.classList.remove("playing");
    }
}

function toggleMusic() {
    triggerHaptic("light");
    setMusicState(!isMusicPlaying);
}

if (musicToggle) musicToggle.addEventListener("click", toggleMusic);
if (floatingMusicToggle) floatingMusicToggle.addEventListener("click", toggleMusic);

// ------------------------------------------
// Screen Navigation
// ------------------------------------------
function showScreen(screenId) {
    screens.forEach(screen => {
        screen.classList.remove("active-screen");
        screen.classList.add("hidden-screen");
    });
    
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.remove("hidden-screen");
        target.classList.add("active-screen");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // Show floating music bar once unlocked beyond passcode/gift
    if (globalMusicBar) {
        if (screenId === "passcode-screen" || screenId === "error-screen") {
            globalMusicBar.classList.add("hidden");
        } else {
            globalMusicBar.classList.remove("hidden");
        }
    }
}

// ------------------------------------------
// Passcode Logic
// ------------------------------------------
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
    triggerHaptic("light");
    playSound(keypadSound);
    enteredCode += digit;
    updateBoxes();

    if (enteredCode.length === 4) {
        setTimeout(checkPassword, 280);
    }
}

function removeDigit() {
    if (enteredCode.length === 0) return;
    triggerHaptic("rigid");
    playSound(keypadSound);
    enteredCode = enteredCode.slice(0, -1);
    updateBoxes();
}

function checkPassword() {
    if (enteredCode === PASSWORD) {
        triggerHaptic("success");
        triggerConfetti();
        // Start romantic bg music
        setMusicState(true);
        showScreen("gift-screen");
    } else {
        triggerHaptic("error");
        showScreen("error-screen");
    }
}

function resetPasscode() {
    enteredCode = "";
    updateBoxes();
    showScreen("passcode-screen");
}

// ------------------------------------------
// Keypad & Hardware Keyboard Listeners
// ------------------------------------------
keyButtons.forEach(button => {
    button.addEventListener("click", () => {
        const val = button.getAttribute("data-key") || button.textContent.trim();
        if (val === "backspace" || val === "⌫") removeDigit();
        else if (val === "enter" || val === "UNLOCK") {
            triggerHaptic("medium");
            playSound(keypadSound);
            if (enteredCode.length === 4) checkPassword();
        } else if (/^[0-9]$/.test(val)) {
            addDigit(val);
        }
    });
});

document.addEventListener("keydown", (e) => {
    if (e.key >= "0" && e.key <= "9") addDigit(e.key);
    else if (e.key === "Backspace") removeDigit();
    else if (e.key === "Enter" && enteredCode.length === 4) checkPassword();
});

// ------------------------------------------
// Screen Next & Back Handlers
// ------------------------------------------
if (tryAgainBtn) {
    tryAgainBtn.addEventListener("click", () => {
        triggerHaptic("light");
        resetPasscode();
    });
}

if (giftBox) {
    giftBox.addEventListener("click", () => {
        triggerHaptic("success");
        playSound(giftPopSound);
        const animatedBox = giftBox.querySelector(".gift-animated");
        if (animatedBox) animatedBox.textContent = "💖";
        triggerConfetti();
        setMusicState(true);
    });
}

if (openGiftBtn) {
    openGiftBtn.addEventListener("click", () => {
        triggerHaptic("medium");
        setMusicState(true);
        showScreen("welcome-screen");
    });
}

document.getElementById("startJourneyBtn")?.addEventListener("click", () => {
    triggerHaptic("light");
    showScreen("calendar-screen");
});

document.getElementById("calendarNextBtn")?.addEventListener("click", () => {
    triggerHaptic("light");
    showScreen("map-screen");
});

document.getElementById("mapNextBtn")?.addEventListener("click", () => {
    triggerHaptic("light");
    showScreen("firsts-screen");
});

document.getElementById("firstsNextBtn")?.addEventListener("click", () => {
    triggerHaptic("light");
    showScreen("memories-screen");
});

document.getElementById("memoriesNextBtn")?.addEventListener("click", () => {
    triggerHaptic("light");
    showScreen("gallery-screen");
});

document.getElementById("galleryNextBtn")?.addEventListener("click", () => {
    triggerHaptic("light");
    showScreen("letter-screen");
});

document.getElementById("letterNextBtn")?.addEventListener("click", () => {
    triggerHaptic("success");
    triggerConfetti();
    showScreen("ending-screen");
});

// Dynamic Back Buttons Listener
document.querySelectorAll(".nav-back-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        triggerHaptic("light");
        const targetScreen = btn.getAttribute("data-target");
        if (targetScreen) showScreen(targetScreen);
    });
});

// Ending screen actions: Send hearts to Telegram bot and user
document.getElementById("sendLoveBtn")?.addEventListener("click", () => {
    triggerHaptic("success");
    playSound(giftPopSound);
    triggerConfetti();
    spawnHeartExplosion();

    const sendBtn = document.getElementById("sendLoveBtn");
    if (sendBtn) {
        sendBtn.textContent = "💖 Love Hearts Sent! 💌";
        sendBtn.style.background = "#2E5A44";
    }

    // Extract Telegram User Context
    let userId = null;
    try {
        const urlParams = new URLSearchParams(window.location.search);
        userId = urlParams.get("user_id") || window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
    } catch (e) {}

    // 1. Dispatch through Telegram WebApp sendData (native Keyboard WebApp)
    if (window.Telegram && window.Telegram.WebApp) {
        try {
            window.Telegram.WebApp.sendData(JSON.stringify({
                action: "send_hearts",
                user_id: userId,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.log("WebApp sendData notice:", e);
        }
    }

    // 2. Direct deep link fallback to send hearts into the bot chat
    setTimeout(() => {
        if (window.Telegram?.WebApp?.openTelegramLink) {
            window.Telegram.WebApp.openTelegramLink("https://t.me/meowanuBot?start=hearts");
        }
    }, 1200);
});

document.getElementById("restartBtn")?.addEventListener("click", () => {
    triggerHaptic("medium");
    const sendBtn = document.getElementById("sendLoveBtn");
    if (sendBtn) {
        sendBtn.textContent = "Send Love Hearts 💖";
        sendBtn.style.background = "";
    }
    resetPasscode();
});

// ------------------------------------------
// Floating Background Hearts Generator
// ------------------------------------------
function initFloatingHearts() {
    const bg = document.getElementById("heart-bg");
    if (!bg) return;
    
    const heartSymbols = ["❤️", "💖", "💕", "✨", "🌸"];
    
    setInterval(() => {
        if (document.hidden) return;
        const heart = document.createElement("div");
        heart.classList.add("floating-heart");
        heart.textContent = heartSymbols[Math.floor(Math.random() * heartSymbols.length)];
        heart.style.left = Math.random() * 95 + "vw";
        heart.style.animationDuration = (Math.random() * 3 + 5.5) + "s";
        heart.style.fontSize = (Math.random() * 12 + 14) + "px";
        bg.appendChild(heart);
        setTimeout(() => heart.remove(), 8500);
    }, 650);
}
initFloatingHearts();

// ------------------------------------------
// Zero-Dependency Fallback Confetti Engine
// (Guaranteed to work in Iran with VPN drops)
// ------------------------------------------
function triggerConfetti() {
    if (typeof confetti === "function") {
        try {
            confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#C84B5B', '#D4AF37', '#FFF4EA', '#E29578', '#FF69B4']
            });
            return;
        } catch (e) {}
    }
    // Fallback lightweight DOM heart burst
    spawnHeartExplosion();
}

function spawnHeartExplosion() {
    const burstCount = 25;
    const symbols = ["💖", "❤️", "✨", "🌹", "💌"];
    for (let i = 0; i < burstCount; i++) {
        const p = document.createElement("div");
        p.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        p.style.position = "fixed";
        p.style.left = "50vw";
        p.style.top = "50vh";
        p.style.fontSize = (Math.random() * 16 + 18) + "px";
        p.style.pointerEvents = "none";
        p.style.zIndex = "999";
        p.style.transition = "all 1s cubic-bezier(0.25, 1, 0.5, 1)";
        p.style.opacity = "1";
        
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 200 + 80;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;

        document.body.appendChild(p);

        requestAnimationFrame(() => {
            p.style.transform = `translate(${tx}px, ${ty}px) scale(${Math.random() * 0.8 + 0.8}) rotate(${Math.random() * 360}deg)`;
            p.style.opacity = "0";
        });

        setTimeout(() => p.remove(), 1050);
    }
}