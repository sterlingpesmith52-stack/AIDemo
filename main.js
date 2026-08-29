/* --- LOAD HUGGINGFACE CLIENT (non‑module version) --- */
const client = new Hf({
    apiKey: "HFAKEYcDeLc9KPgeVpZDQ43yo"
});

/* --- WAIT FOR CLIENT --- */
async function waitForClient() {
    while (!client) {
        await new Promise(r => setTimeout(r, 50));
    }
}

/* --- SAFARI ADDRESS BAR HIDE --- */
window.addEventListener("load", () => {
    window.scrollTo(0, 1);
});

/* --- MODE SYSTEM --- */

const modes = [
    "Normal",
    "Instructions",
    "Explain",
    "Summary",
    "Creative",
    "AI"
];

const displayNames = {
    "Normal": "Start here",
    "Instructions": "Instructions",
    "Explain": "Explain",
    "Summary": "Summary",
    "Creative": "Creative",
    "AI": "AI"
};

const systemMessages = {
    "Normal": "Respond helpfully to the user's text.",
    "Instructions": "Give clear, step-by-step instructions.",
    "Summary": "Summarize the user's text in 3 to 5 words.",
    "Explain": "Explain the user's text clearly.",
    "Creative": "Rewrite the user's text creatively.",
    "AI": "Respond as an AI assistant."
};

let modeIndex = 0;
let history = [];

/* --- TYPE / MODE BUTTON --- */

const typeBtn = document.getElementById("typeBtn");

async function handleTypeTap() {
    try {
        modeIndex = (modeIndex + 1) % modes.length;
        const mode = modes[modeIndex];
        document.getElementById("modeDisplay").value = displayNames[mode];

        const input = document.getElementById("promptArea").value;
        const outputArea = document.getElementById("outputArea");

        if (!input.trim()) {
            outputArea.value = "";
            return;
        }

        await waitForClient();
        outputArea.value = "";

        const stream = await client.responses.stream({
            model: "gpt-4.1-mini",
            messages: [
                { role: "system", content: systemMessages[mode] },
                { role: "user", content: input }
            ]
        });

        let fullText = "";

        for await (const chunk of stream) {
            if (chunk.type === "response.output_text.delta") {
                outputArea.value += chunk.delta;
                fullText += chunk.delta;
            }
        }

        history.push({ mode, input, output: fullText });

    } catch (err) {
        document.getElementById("outputArea").value =
            "⚠️ Error: " + (err.message || "Unknown error");
    }
}

typeBtn.addEventListener("touchstart", handleTypeTap, { passive: true });
typeBtn.addEventListener("click", handleTypeTap);

/* --- CLEAR --- */
document.getElementById("clearBtn").onclick = function () {
    document.getElementById("promptArea").value = "";
    document.getElementById("outputArea").value = "";
    history = [];
};

/* --- PASTE --- */
document.getElementById("pasteBtn").onclick = async function () {
    const area = document.getElementById("promptArea");
    area.focus();

    if (navigator.clipboard && navigator.clipboard.readText) {
        try {
            const text = await navigator.clipboard.readText();
            area.value = text;
            return;
        } catch (e) {}
    }

    document.execCommand("paste");
};

/* --- COPY --- */
document.getElementById("copyBtn").onclick = async function () {
    try {
        const text = document.getElementById("outputArea").value;
        await navigator.clipboard.writeText(text);
    } catch (e) {
        alert("Copy failed.");
    }
};

/* --- DARK MODE --- */
document.getElementById("darkBtn").onclick = function () {
    const frame = document.querySelector(".mobile-frame");
    const buttons = document.querySelectorAll("button");
    const areas = document.querySelectorAll("#promptArea, #outputArea");
    const header = document.querySelector("header");
    const modeDisplay = document.getElementById("modeDisplay");

    const dark = frame.style.backgroundColor !== "rgb(34, 34, 34)";

    if (dark) {
        frame.style.backgroundColor = "#222";
        frame.style.color = "#eee";
        header.style.color = "#eee";

        modeDisplay.style.backgroundColor = "#333";
        modeDisplay.style.color = "#eee";
        modeDisplay.style.borderColor = "#555";

        buttons.forEach(btn => {
            btn.style.backgroundColor = "#0f1e4d";
            btn.style.color = "#eee";
            btn.style.borderColor = "#0a1538";
        });

        areas.forEach(area => {
            area.style.backgroundColor = "#333";
            area.style.color = "#eee";
            area.style.borderColor = "#555";
        });

    } else {
        frame.style.backgroundColor = "#e9f3ff";
        frame.style.color = "#333";
        header.style.color = "#000";

        modeDisplay.style.backgroundColor = "#ffffff";
        modeDisplay.style.color = "#333";
        modeDisplay.style.borderColor = "#ccc";

        buttons.forEach(btn => {
            btn.style.backgroundColor = "#1e3a8a";
            btn.style.color = "#fff";
            btn.style.borderColor = "#162d6b";
        });

        areas.forEach(area => {
            area.style.backgroundColor = "#f9f9f9";
            area.style.color = "#333";
            area.style.borderColor = "#ccc";
        });
    }
};

/* --- VOICE --- */
speechSynthesis.onvoiceschanged = () => {
    window.availableVoices = speechSynthesis.getVoices();
};

document.getElementById("voiceBtn").onclick = function () {
    const text = document.getElementById("outputArea").value;
    if (!text.trim()) return;

    speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);

    if (window.availableVoices) {
        utter.voice = window.availableVoices.find(v => v.lang === "en-US");
    }

    setTimeout(() => speechSynthesis.speak(utter), 50);
};

/* --- HISTORY --- */
document.getElementById("historyBtn").onclick = function () {
    const outputArea = document.getElementById("outputArea");

    if (history.length === 0) {
        outputArea.value = "No history yet.";
        return;
    }

    let text = "";
    history.forEach((item, index) => {
        text += `#${index + 1} — ${item.mode}\n`;
        text += `Input: ${item.input}\n`;
        text += `Output: ${item.output}\n\n`;
    });

    outputArea.value = text.trim();
};
