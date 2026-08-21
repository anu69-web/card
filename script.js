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
// Haptic & Sound Effects (Guaranteed Mobile Vibrations)
// ------------------------------------------
function triggerHaptic(type = "success") {
    const tg = window.Telegram?.WebApp;
    if (tg?.HapticFeedback) {
        try {
            if (type === "error") {
                tg.HapticFeedback.notificationOccurred("error");
            } else if (type === "warning") {
                tg.HapticFeedback.notificationOccurred("warning");
            } else {
                // Guaranteed hardware vibration on iOS & Android Telegram
                tg.HapticFeedback.notificationOccurred("success");
                tg.HapticFeedback.impactOccurred?.("heavy");
                tg.HapticFeedback.selectionChanged?.();
            }
        } catch (e) {}
    }

    // Hardware Vibration API fallback
    try {
        if (navigator.vibrate) {
            if (type === "error") navigator.vibrate([50, 40, 50]);
            else navigator.vibrate([35, 35]);
        }
    } catch (e) {}
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
    triggerHaptic("success");
    setMusicState(!isMusicPlaying);
}

if (musicToggle) musicToggle.addEventListener("click", toggleMusic);
if (floatingMusicToggle) floatingMusicToggle.addEventListener("click", toggleMusic);

// ------------------------------------------
// Screen Navigation
// ------------------------------------------
function showScreen(screenId) {
    document.querySelectorAll("section").forEach(screen => {
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
    if (enteredCode.length < 4) {
        enteredCode += digit;
        triggerHaptic("success");
        playSound(keypadSound);
        updateBoxes();
        if (enteredCode.length === 4) {
            setTimeout(checkPasscode, 250);
        }
    }
}

function removeDigit() {
    if (enteredCode.length > 0) {
        enteredCode = enteredCode.slice(0, -1);
        triggerHaptic("success");
        playSound(keypadSound);
        updateBoxes();
    }
}

function resetPasscode() {
    enteredCode = "";
    updateBoxes();
    showScreen("passcode-screen");
}

function checkPasscode() {
    if (enteredCode === PASSWORD) {
        triggerHaptic("success");
        playSound(giftPopSound);
        triggerConfetti();
        showScreen("gift-screen");
    } else {
        triggerHaptic("error");
        showScreen("error-screen");
    }
}

// Keypad Event Listeners
keyButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        const key = btn.getAttribute("data-key");
        if (key === "backspace") {
            removeDigit();
        } else if (key === "enter") {
            if (enteredCode.length === 4) {
                checkPasscode();
            } else {
                triggerHaptic("error");
            }
        } else {
            addDigit(key);
        }
    });
});

// Keyboard Physical Typing Support
document.addEventListener("keydown", (e) => {
    const activeScreen = document.querySelector("section.active-screen");
    if (!activeScreen || activeScreen.id !== "passcode-screen") return;

    if (e.key >= "0" && e.key <= "9") {
        addDigit(e.key);
    } else if (e.key === "Backspace") {
        removeDigit();
    } else if (e.key === "Enter") {
        if (enteredCode.length === 4) checkPasscode();
    }
});

// ------------------------------------------
// Screen Next & Back Handlers
// ------------------------------------------
if (tryAgainBtn) {
    tryAgainBtn.addEventListener("click", () => {
        triggerHaptic("success");
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
        triggerHaptic("success");
        setMusicState(true);
        showScreen("welcome-screen");
    });
}

document.getElementById("startJourneyBtn")?.addEventListener("click", () => {
    triggerHaptic("success");
    showScreen("calendar-screen");
});

document.getElementById("calendarNextBtn")?.addEventListener("click", () => {
    triggerHaptic("success");
    showScreen("map-screen");
});

document.getElementById("mapNextBtn")?.addEventListener("click", () => {
    triggerHaptic("success");
    showScreen("firsts-screen");
});

document.getElementById("firstsNextBtn")?.addEventListener("click", () => {
    triggerHaptic("success");
    showScreen("memories-screen");
});

// Dedicated Chapter Screen Next Buttons
document.getElementById("ch1NextBtn")?.addEventListener("click", () => {
    triggerHaptic("success");
    showScreen("chapter2-screen");
});

document.getElementById("ch2NextBtn")?.addEventListener("click", () => {
    triggerHaptic("success");
    showScreen("chapter3-screen");
});

document.getElementById("ch3NextBtn")?.addEventListener("click", () => {
    triggerHaptic("success");
    showScreen("memories-screen");
});

// Main Stories Screen Next Button (Takes to Gallery)
document.getElementById("memoriesNextBtn")?.addEventListener("click", () => {
    triggerHaptic("success");
    showScreen("gallery-screen");
});

document.getElementById("galleryNextBtn")?.addEventListener("click", () => {
    triggerHaptic("success");
    showScreen("letter-screen");
});

document.getElementById("letterNextBtn")?.addEventListener("click", () => {
    triggerHaptic("success");
    triggerConfetti();
    showScreen("ending-screen");
});

// Universal Document-Level Click Handler for Instant Mobile Responsiveness
document.addEventListener("click", (e) => {
    // 1. Chapter Cards Tap (Mobile touch proof)
    const chapterCard = e.target.closest(".clickable-chapter, [data-chapter]");
    if (chapterCard) {
        const chNum = chapterCard.getAttribute("data-chapter") || (chapterCard.id === "storyCard1" ? "1" : chapterCard.id === "storyCard2" ? "2" : "3");
        triggerHaptic("success");
        showScreen(`chapter${chNum}-screen`);
        return;
    }

    // 2. Dynamic Back Buttons
    const backBtn = e.target.closest(".nav-back-btn, [data-target]");
    if (backBtn) {
        const targetScreen = backBtn.getAttribute("data-target");
        if (targetScreen) {
            triggerHaptic("success");
            showScreen(targetScreen);
        }
        return;
    }

    // 3. Any interactive button haptic feedback
    const genericBtn = e.target.closest(".nav-arrow-btn, .pill-btn, .nav-next-chapter");
    if (genericBtn) {
        triggerHaptic("success");
    }
});

// Floating Toast Notification
function showToast(message) {
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        container.className = "toast-container";
        document.body.appendChild(container);
    }
    const toast = document.createElement("div");
    toast.className = "toast-msg";
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3500);
}

document.getElementById("restartBtn")?.addEventListener("click", () => {
    triggerHaptic("medium");
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