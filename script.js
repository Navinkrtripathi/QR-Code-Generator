// ==================== SECTION NAVIGATION ====================
const navLinks = document.querySelectorAll(".nav-link");
const sections = document.querySelectorAll(".section");

function showSection(name) {
    sections.forEach((sec) => {
        sec.classList.toggle("active", sec.id === `section-${name}`);
    });

    navLinks.forEach((link) => {
        link.classList.toggle("active", link.dataset.section === name);
    });

    if (name === "scan") {
        startScanner();
    } else {
        stopScanner();
    }
}

navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        const target = link.dataset.section;
        showSection(target);
    });
});

// ==================== AUTH + FIREBASE ====================
let firebaseApp = null;
let auth = null;
let db = null;
let currentUser = null;

const userEmailSpan = document.getElementById("userEmail");
const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

function initFirebase() {
    if (typeof firebase === "undefined") {
        console.warn("Firebase SDK not loaded.");
        return;
    }

    const firebaseConfig = {
  apiKey: "AIzaSyA-HnxN1iDWftaaaegytsR07s3QoVD6mrU",
  authDomain: "qr-solution-platform.firebaseapp.com",
  projectId: "qr-solution-platform",
  storageBucket: "qr-solution-platform.firebasestorage.app",
  messagingSenderId: "506501863602",
  appId: "1:506501863602:web:2ffd3be24bf8bef78911ab"
};

    try {
        firebaseApp = firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();

        auth.onAuthStateChanged((user) => {
            currentUser = user || null;
            updateAuthUI();
        });
    } catch (err) {
        console.error("Firebase init error:", err);
    }
}

function updateAuthUI() {
    if (!userEmailSpan || !logoutBtn || !loginBtn || !signupBtn) return;

    if (currentUser) {
        userEmailSpan.textContent = currentUser.email;
        logoutBtn.classList.remove("hidden");
        loginBtn.classList.add("hidden");
        signupBtn.classList.add("hidden");
    } else {
        userEmailSpan.textContent = "Not logged in";
        logoutBtn.classList.add("hidden");
        loginBtn.classList.remove("hidden");
        signupBtn.classList.remove("hidden");
    }
}

// if (signupBtn) {
//     signupBtn.addEventListener("click", async () => {
//         if (!auth) {
//             alert("Firebase not configured yet.");
//             return;
//         }
//         const email = prompt("Enter email for sign up:");
//         const password = prompt("Enter password (min 6 chars):");
//         if (!email || !password) return;

//         try {
//             await auth.createUserWithEmailAndPassword(email, password);
//             alert("Sign up successful. Logged in as " + email);
//         } catch (err) {
//             console.error(err);
//             alert(err.message || "Error during sign up.");
//         }
//     });
// }

// if (loginBtn) {
//     loginBtn.addEventListener("click", async () => {
//         if (!auth) {
//             alert("Firebase not configured yet.");
//             return;
//         }
//         const email = prompt("Enter your email:");
//         const password = prompt("Enter your password:");
//         if (!email || !password) return;

//         try {
//             await auth.signInWithEmailAndPassword(email, password);
//             alert("Logged in as " + email);
//         } catch (err) {
//             console.error(err);
//             alert(err.message || "Error during login.");
//         }
//     });
// }
if (signupBtn) {
    signupBtn.addEventListener("click", async () => {
        // prompt() based sign up
    });
}

if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
        // prompt() based login
    });
}


if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        if (!auth) return;
        try {
            await auth.signOut();
        } catch (err) {
            console.error(err);
        }
    });
}

// ==================== COMMON QR GENERATION ====================
function generateQRCode(element, text, width, height, colorDark, colorLight) {
    element.innerHTML = "";
    new QRCode(element, {
        text: text,
        width: parseInt(width, 10),
        height: parseInt(height, 10),
        colorDark: colorDark,
        colorLight: colorLight,
    });
}

function getDataUrlFromBody(body) {
    let img = body.querySelector("img");
    let canvas = body.querySelector("canvas");

    if (img && img.src) return img.src;
    if (canvas) return canvas.toDataURL("image/png");
    return null;
}

// ==================== HISTORY (LOCAL + CLOUD PUSH) ====================
const HISTORY_KEY = "qr-solution-history";

function saveToHistory(entry) {
    try {
        const history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
        history.unshift(entry);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
        renderHistory();
    } catch (err) {
        console.error("Error storing local history:", err);
    }

    // Push to Firestore as cloud backup
    if (db && currentUser) {
        db.collection("users")
            .doc(currentUser.uid)
            .collection("history")
            .add({
                ...entry,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            })
            .catch((err) => console.error("Cloud save error:", err));
    }
}

function renderHistory() {
    const historyContainer = document.getElementById("history-list");
    if (!historyContainer) return;

    const history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    if (history.length === 0) {
        historyContainer.innerHTML =
            '<p class="empty-state">No local history yet. Generate a QR code in the "Generate" section.</p>';
        return;
    }

    historyContainer.innerHTML = "";
    history.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "history-item";

        div.innerHTML = `
            <img src="${item.dataUrl}" alt="QR ${index + 1}" class="history-img" />
            <div class="history-meta">
                <p class="history-text">${item.text}</p>
                <span class="history-type">${item.type}</span>
                <span class="history-date">${item.date}</span>
            </div>
            <button class="history-regenerate">Re-generate</button>
        `;

        const regenBtn = div.querySelector(".history-regenerate");
        regenBtn.addEventListener("click", () => {
            qrText.value = item.text;
            sizes.value = item.size || "200";
            fgColor.value = item.fgColor || "#000000";
            bgColor.value = item.bgColor || "#ffffff";
            showSection("generate");
            generateQRCode(
                qrBody,
                item.text,
                sizes.value,
                sizes.value,
                fgColor.value,
                bgColor.value
            );
        });

        historyContainer.appendChild(div);
    });
}

const clearHistoryBtn = document.getElementById("clearHistoryBtn");
if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (confirm("Clear local QR history on this device?")) {
            localStorage.removeItem(HISTORY_KEY);
            renderHistory();
        }
    });
}

// ==================== MAIN GENERATOR ELEMENTS ====================
const qrText = document.getElementById("qr-text");
const sizes = document.getElementById("sizes");
const fgColor = document.getElementById("fgColor");
const bgColor = document.getElementById("bgColor");
const generateBtn = document.getElementById("generateBtn");
const downloadBtn = document.getElementById("downloadBtn");
const shareBtn = document.getElementById("shareBtn");
const qrBody = document.querySelector(".main-generator .qr-body");

// ==================== CUSTOM QR WITH LOGO ====================
const customQrText = document.getElementById("custom-qr-text");
const customSizes = document.getElementById("custom-sizes");
const logoUpload = document.getElementById("logoUpload");
const generateCustomBtn = document.getElementById("generateCustomBtn");
const downloadCustomBtn = document.getElementById("downloadCustomBtn");
const customQrBody = document.querySelector(".custom-qr .qr-body");

// ==================== RESTAURANT / SHOP QR ====================
const restroName = document.getElementById("restro-name");
const restroTable = document.getElementById("restro-table");
const restroMenuLink = document.getElementById("restro-menu-link");
const restroSizes = document.getElementById("restro-sizes");
const generateRestroBtn = document.getElementById("generateRestroBtn");
const downloadRestroBtn = document.getElementById("downloadRestroBtn");
const restroQrBody = document.querySelector(".restro-order-system .qr-body");

// ==================== LOGO OVERLAY (DOWNLOAD-READY) ====================
function addLogoToQR(qrBodyElement, logoFile) {
    setTimeout(() => {
        const canvas = qrBodyElement.querySelector("canvas");
        if (!canvas) {
            console.error("Canvas not found for logo overlay.");
            return;
        }
        const ctx = canvas.getContext("2d");
        const logo = new Image();
        const reader = new FileReader();

        reader.onload = function (event) {
            logo.src = event.target.result;
            logo.onload = () => {
                const logoSize = canvas.width / 5;
                ctx.drawImage(
                    logo,
                    (canvas.width - logoSize) / 2,
                    (canvas.height - logoSize) / 2,
                    logoSize,
                    logoSize
                );

                // Convert canvas (with logo) to image, so download uses logo version
                const finalDataUrl = canvas.toDataURL("image/png");
                const img = new Image();
                img.src = finalDataUrl;
                img.className = "qr-with-logo";
                qrBodyElement.innerHTML = "";
                qrBodyElement.appendChild(img);
            };
        };
        reader.readAsDataURL(logoFile);
    }, 500);
}

// ==================== DOWNLOAD & SHARE ====================
function attachDownload(btn, body, preferCanvas = false) {
    if (!btn) return;
    btn.addEventListener("click", (e) => {
        e.preventDefault();
        let canvas = body.querySelector("canvas");
        let img = body.querySelector("img");

        let dataUrl = null;

        if (preferCanvas && canvas) {
            dataUrl = canvas.toDataURL("image/png");
        } else if (img && img.src) {
            dataUrl = img.src;
        } else if (canvas) {
            dataUrl = canvas.toDataURL("image/png");
        }

        if (!dataUrl) {
            alert("Please generate a QR code first.");
            return;
        }

        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = "QR_Code.png";
        link.click();
    });
}

function attachShare(btn, body) {
    if (!btn) return;

    btn.addEventListener("click", async (e) => {
        e.preventDefault();
        let canvas = body.querySelector("canvas");
        let img = body.querySelector("img");

        let dataUrl = img?.src || (canvas && canvas.toDataURL("image/png"));
        if (!dataUrl) {
            alert("Please generate a QR code first.");
            return;
        }

        try {
            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], "QR_Code.png", { type: blob.type });

            if (navigator.share && navigator.canShare?.({ files: [file] })) {
                await navigator.share({
                    title: "My QR Code",
                    text: "Here’s a QR code I generated.",
                    files: [file],
                });
            } else {
                alert("Sharing is not supported in this browser.");
            }
        } catch (err) {
            console.error(err);
            alert("Error while sharing this QR code.");
        }
    });
}

// ==================== MAIN GENERATOR EVENTS ====================
if (generateBtn) {
    generateBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const value = qrText.value.trim();
        if (!value) {
            alert("Please enter text or URL.");
            return;
        }
        generateQRCode(qrBody, value, sizes.value, sizes.value, fgColor.value, bgColor.value);

        setTimeout(() => {
            const dataUrl = getDataUrlFromBody(qrBody);
            if (dataUrl) {
                saveToHistory({
                    type: "Standard",
                    text: value,
                    size: sizes.value,
                    fgColor: fgColor.value,
                    bgColor: bgColor.value,
                    date: new Date().toLocaleString(),
                    dataUrl,
                });
            }
        }, 400);
    });
}

// Custom QR with Logo events
if (generateCustomBtn) {
    generateCustomBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const value = customQrText.value.trim();
        if (!value) {
            alert("Please enter text or URL for custom QR.");
            return;
        }

        // First generate standard QR on canvas
        generateQRCode(
            customQrBody,
            value,
            customSizes.value,
            customSizes.value,
            "#000000",
            "#ffffff"
        );

        if (logoUpload.files[0]) {
            // After this, QR inside customQrBody becomes an <img> with logo applied
            addLogoToQR(customQrBody, logoUpload.files[0]);
        }

        setTimeout(() => {
            const dataUrl = getDataUrlFromBody(customQrBody);
            if (dataUrl) {
                saveToHistory({
                    type: "Custom with Logo",
                    text: value,
                    size: customSizes.value,
                    date: new Date().toLocaleString(),
                    dataUrl,
                });
            }
        }, 800);
    });
}

// Restaurant QR events
if (generateRestroBtn) {
    generateRestroBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const name = restroName.value.trim();
        const table = restroTable.value.trim();
        const menu = restroMenuLink.value.trim();

        if (!name && !table && !menu) {
            alert("Please fill at least one field for the restaurant/shop QR.");
            return;
        }

        const orderData = `Restaurant/Shop: ${name || "-"}
Table/Counter: ${table || "-"}
Menu/Catalog: ${menu || "-"}`;

        generateQRCode(
            restroQrBody,
            orderData,
            restroSizes.value,
            restroSizes.value,
            "#000000",
            "#ffffff"
        );

        setTimeout(() => {
            const dataUrl = getDataUrlFromBody(restroQrBody);
            if (dataUrl) {
                saveToHistory({
                    type: "Restaurant/Shop",
                    text: orderData.replace(/\n/g, " | "),
                    size: restroSizes.value,
                    date: new Date().toLocaleString(),
                    dataUrl,
                });
            }
        }, 400);
    });
}

// Attach download & share handlers
attachDownload(downloadBtn, qrBody);
attachShare(shareBtn, qrBody);
attachDownload(downloadCustomBtn, customQrBody, false);
attachDownload(downloadRestroBtn, restroQrBody);

// ==================== QR SCANNER (HTML5-QRCODE) ====================
let html5QrCode = null;
const qrScanText = document.getElementById("qr-scan-text");
const stopScanBtn = document.getElementById("stopScanBtn");

function startScanner() {
    const readerElementId = "qr-reader";
    const readerElement = document.getElementById(readerElementId);
    if (!readerElement || !window.Html5Qrcode) return;

    if (html5QrCode) {
        return;
    }

    html5QrCode = new Html5Qrcode(readerElementId);
    html5QrCode
        .start(
            { facingMode: "environment" },
            { fps: 10, qrbox: 250 },
            (decodedText) => {
                if (qrScanText) qrScanText.textContent = decodedText;
            },
            () => {}
        )
        .catch((err) => {
            console.error("Camera start error:", err);
            if (qrScanText) qrScanText.textContent = "Error accessing camera.";
        });
}

function stopScanner() {
    if (!html5QrCode) return;

    html5QrCode
        .stop()
        .then(() => {
            html5QrCode.clear();
            html5QrCode = null;
        })
        .catch((err) => console.error("Error stopping scanner:", err));
}

if (stopScanBtn) {
    stopScanBtn.addEventListener("click", (e) => {
        e.preventDefault();
        stopScanner();
    });
}

// ==================== BULK GENERATOR + CSV + ZIP ====================
const bulkInput = document.getElementById("bulk-input");
const bulkCsvInput = document.getElementById("bulkCsv");
const generateBulkBtn = document.getElementById("generateBulkBtn");
const downloadBulkZipBtn = document.getElementById("downloadBulkZipBtn");
const bulkResults = document.getElementById("bulk-results");

let bulkGenerated = []; // { text, dataUrl }

function processBulkLines(lines) {
    if (!bulkResults) return;

    bulkResults.innerHTML = "";
    bulkGenerated = [];

    lines.forEach((text, index) => {
        const card = document.createElement("div");
        card.className = "bulk-item";

        const qrContainer = document.createElement("div");
        qrContainer.className = "qr-body bulk-qr-body";

        const label = document.createElement("p");
        label.className = "bulk-label";
        label.textContent = `${index + 1}. ${text}`;

        card.appendChild(qrContainer);
        card.appendChild(label);
        bulkResults.appendChild(card);

        generateQRCode(qrContainer, text, 150, 150, "#000000", "#ffffff");

        setTimeout(() => {
            const dataUrl = getDataUrlFromBody(qrContainer);
            if (dataUrl) {
                bulkGenerated.push({ text, dataUrl });
            }
        }, 300);
    });
}

if (generateBulkBtn) {
    generateBulkBtn.addEventListener("click", (e) => {
        e.preventDefault();

        const txtLines = bulkInput.value
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0);

        if (bulkCsvInput.files[0]) {
            const file = bulkCsvInput.files[0];
            const reader = new FileReader();
            reader.onload = function (event) {
                const csvText = event.target.result;
                const csvLines = csvText
                    .split(/\r?\n/)
                    .map((row) => row.split(",")[0].trim())
                    .filter((v) => v.length > 0);

                const combined = [...txtLines, ...csvLines];
                if (combined.length === 0) {
                    alert("No valid lines in textarea or CSV.");
                    return;
                }
                processBulkLines(combined);
            };
            reader.readAsText(file);
        } else {
            if (txtLines.length === 0) {
                alert("Please enter at least one line or upload a CSV.");
                return;
            }
            processBulkLines(txtLines);
        }
    });
}

if (downloadBulkZipBtn) {
    downloadBulkZipBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (!bulkGenerated.length) {
            alert("Generate some bulk QR codes first.");
            return;
        }
        if (typeof JSZip === "undefined" || typeof saveAs === "undefined") {
            alert("ZIP libraries not loaded.");
            return;
        }

        const zip = new JSZip();
        bulkGenerated.forEach((item, index) => {
            const base64 = item.dataUrl.split(",")[1];
            zip.file(`qr_${index + 1}.png`, base64, { base64: true });
        });

        zip.generateAsync({ type: "blob" }).then((blob) => {
            saveAs(blob, "Bulk_QR_Codes.zip");
        });
    });
}

// ==================== CHATBOT HELPER ====================
function getBotReply(rawMsg) {
    const msg = rawMsg.toLowerCase();

    if (msg.includes("generate") || msg.includes("standard qr")) {
        return (
            "To generate a standard QR:\n" +
            "1) Go to the 'Generate' section.\n" +
            "2) Type your text or URL in the first box.\n" +
            "3) Choose size and colors.\n" +
            "4) Click 'Generate', then use Download/Share."
        );
    }

    if (msg.includes("logo")) {
        return (
            "To create a QR with logo:\n" +
            "1) In the 'Generate' section, use 'Custom QR with Logo'.\n" +
            "2) Enter your text or website.\n" +
            "3) Select a size and upload your logo image.\n" +
            "4) Click 'Generate'. The downloaded image already includes the logo."
        );
    }

    if (msg.includes("scan") || msg.includes("scanner") || msg.includes("read qr")) {
        return (
            "To scan a QR:\n" +
            "1) Open the 'Scan' section.\n" +
            "2) Allow camera permission.\n" +
            "3) Point the camera at a QR code.\n" +
            "4) The result will appear under 'Result'."
        );
    }

    if (msg.includes("history") || msg.includes("saved")) {
        return (
            "About history:\n" +
            "- Every generated QR is stored locally under the 'History' section.\n" +
            "- You can re-generate a QR by clicking the 'Re-generate' button.\n" +
            "- 'Clear Local History' removes them from this device.\n" +
            "- When logged in, basic info is also saved to the cloud (Firestore)."
        );
    }

    if (msg.includes("bulk") || msg.includes("csv") || msg.includes("many") || msg.includes("multiple")) {
        return (
            "To generate bulk QR codes:\n" +
            "1) Go to the 'Bulk' section.\n" +
            "2) Either type one text/URL per line in the textbox, or upload a CSV.\n" +
            "3) Click 'Generate All' to preview.\n" +
            "4) Click 'Download ZIP' to download all QR codes as a zip file."
        );
    }

    if (msg.includes("login") || msg.includes("sign in") || msg.includes("signup") || msg.includes("sign up") || msg.includes("account")) {
        return (
            "For login and signup:\n" +
            "- Use 'Sign Up' to create a new account (email + password).\n" +
            "- Use 'Login' to access your existing account.\n" +
            "- Once logged in, your email appears in the header and your history can be backed up to the cloud.\n" +
            "- Use 'Logout' to sign out safely."
        );
    }

    if (msg.includes("restaurant") || msg.includes("shop") || msg.includes("table") || msg.includes("menu")) {
        return (
            "To create a Restaurant/Shop QR:\n" +
            "1) In 'Generate', use the 'Restaurant / Shop QR' card.\n" +
            "2) Fill Restaurant/Shop name, table/counter and menu/catalog URL (any field you need).\n" +
            "3) Click 'Generate', then Download.\n" +
            "Scanning that QR will show the info you entered."
        );
    }

    if (msg.includes("error") || msg.includes("not working") || msg.includes("problem") || msg.includes("issue")) {
        return (
            "Troubleshooting tips:\n" +
            "- Refresh the page and try again.\n" +
            "- Check if camera permission is allowed for scanning.\n" +
            "- Make sure the text/URL field is not empty.\n" +
            "- If Firebase auth fails, verify that the config in script.js is correct."
        );
    }

    return (
        "I'm a help bot for this QR platform 🙂\n" +
        "You can ask me about:\n" +
        "- Generating QR codes (standard, logo, restaurant)\n" +
        "- Scanning QR codes\n" +
        "- History & cloud backup\n" +
        "- Bulk generation & CSV/ZIP\n" +
        "- Login / Signup\n\n" +
        "Try asking: 'How do I generate a QR with logo?'"
    );
}

function initChatbot() {
    // Create toggle button
    const toggle = document.createElement("div");
    toggle.className = "chatbot-toggle";
    toggle.id = "chatbotToggle";
    toggle.textContent = "?";

    // Create window
    const win = document.createElement("div");
    win.className = "chatbot-window";
    win.id = "chatbotWindow";

    win.innerHTML = `
        <div class="chatbot-header">
            <span>QR Assistant</span>
            <button type="button" id="chatbotClose">&times;</button>
        </div>
        <div class="chatbot-messages" id="chatbotMessages"></div>
        <form class="chatbot-input-row" id="chatbotForm">
            <input type="text" id="chatbotInput" placeholder="Ask how to use the site..." autocomplete="off" />
            <button type="submit">Send</button>
        </form>
    `;

    document.body.appendChild(toggle);
    document.body.appendChild(win);

    const messagesEl = win.querySelector("#chatbotMessages");
    const form = win.querySelector("#chatbotForm");
    const input = win.querySelector("#chatbotInput");
    const closeBtn = win.querySelector("#chatbotClose");

    function addMessage(text, from = "bot") {
        const msg = document.createElement("div");
        msg.className = `chatbot-message ${from}`;
        msg.textContent = text;
        messagesEl.appendChild(msg);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    // Initial welcome message
    addMessage(
        "Hi! I'm your QR helper bot. Ask me anything about generating, scanning, history, bulk QR, or login/signup."
    );

    toggle.addEventListener("click", () => {
        win.classList.toggle("open");
    });

    closeBtn.addEventListener("click", () => {
        win.classList.remove("open");
    });

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;

        // Show user message
        addMessage(text, "user");
        input.value = "";

        // Bot reply
        const reply = getBotReply(text);
        setTimeout(() => addMessage(reply, "bot"), 300);
    });
}

// ==================== INITIALIZE ====================
renderHistory && renderHistory(); // safe if history elements don't exist on some pages
showSection && showSection("generate");
initFirebase && initFirebase();
initChatbot && initChatbot();

