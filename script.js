// Main QR Generator
const qrText = document.getElementById("qr-text");
const sizes = document.getElementById("sizes");
const fgColor = document.getElementById("fgColor");
const bgColor = document.getElementById("bgColor");
const generateBtn = document.getElementById("generateBtn");
const downloadBtn = document.getElementById("downloadBtn");
const shareBtn = document.getElementById("shareBtn");
const qrBody = document.querySelector(".main-generator .qr-body");

// Custom QR with Logo
const customQrText = document.getElementById("custom-qr-text");
const customSizes = document.getElementById("custom-sizes");
const logoUpload = document.getElementById("logoUpload");
const generateCustomBtn = document.getElementById("generateCustomBtn");
const downloadCustomBtn = document.getElementById("downloadCustomBtn");
const customQrBody = document.querySelector(".custom-qr .qr-body");

// Shop/Restaurant QR
const restroName = document.getElementById("restro-name");
const restroTable = document.getElementById("restro-table");
const restroMenuLink = document.getElementById("restro-menu-link");
const restroSizes = document.getElementById("restro-sizes");
const generateRestroBtn = document.getElementById("generateRestroBtn");
const downloadRestroBtn = document.getElementById("downloadRestroBtn");
const restroQrBody = document.querySelector(".restro-order-system .qr-body");

// General QR Generation Function
function generateQRCode(element, text, width, height, colorDark, colorLight) {
    element.innerHTML = "";
    new QRCode(element, {
        text: text,
        width: width,
        height: height,
        colorDark: colorDark,
        colorLight: colorLight,
    });
}

// Function to add logo to QR code
function addLogoToQR(qrBody, logoFile) {
    setTimeout(() => {
        const qrCanvas = qrBody.querySelector("canvas");
        if (!qrCanvas) {
            console.error("Canvas not found for logo.");
            return;
        }
        const ctx = qrCanvas.getContext("2d");
        const logo = new Image();

        const reader = new FileReader();
        reader.onload = function (event) {
            logo.src = event.target.result;
            logo.onload = () => {
                const logoSize = qrCanvas.width / 5;
                ctx.drawImage(
                    logo,
                    (qrCanvas.width - logoSize) / 2,
                    (qrCanvas.height - logoSize) / 2,
                    logoSize,
                    logoSize
                );
            };
        };
        reader.readAsDataURL(logoFile);
    }, 500);
}

// Function to download QR code
function downloadQR(btn, body) {
    btn.addEventListener("click", (e) => {
        e.preventDefault();
        let img = body.querySelector("img") || body.querySelector("canvas");
        if (img) {
            let link = document.createElement("a");
            link.href = img.src;
            link.download = "QR_Code.png";
            link.click();
        } else {
            alert("Please generate a QR code first.");
        }
    });
}

// Function to share QR code
async function shareQR(btn, body) {
    btn.addEventListener("click", async (e) => {
        e.preventDefault();
        let img = body.querySelector("img") || body.querySelector("canvas");
        if (!img) {
            alert("Please generate a QR code first.");
            return;
        }

        const blob = await (await fetch(img.src)).blob();
        const file = new File([blob], "QR_Code.png", { type: blob.type });

        if (navigator.share) {
            navigator.share({
                title: "My QR Code",
                text: "Here’s a QR Code I generated",
                files: [file],
            }).catch(console.error);
        } else {
            alert("Sharing not supported in this browser.");
        }
    });
}

// Event Listeners for each section
// Main Generator
generateBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (qrText.value) {
        generateQRCode(qrBody, qrText.value, sizes.value, sizes.value, fgColor.value, bgColor.value);
    } else {
        alert("Please enter text or URL.");
    }
});

// Custom QR
generateCustomBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (customQrText.value) {
        generateQRCode(customQrBody, customQrText.value, customSizes.value, customSizes.value, "#000000", "#ffffff");
        if (logoUpload.files[0]) {
            addLogoToQR(customQrBody, logoUpload.files[0]);
        }
    } else {
        alert("Please enter text or URL for custom QR.");
    }
});

// Shop/Restaurant QR
generateRestroBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const orderData = `Restaurant Name: ${restroName.value}\nTable Number: ${restroTable.value}\nMenu Link: ${restroMenuLink.value}`;
    if (restroName.value || restroTable.value || restroMenuLink.value) {
        generateQRCode(restroQrBody, orderData, restroSizes.value, restroSizes.value, "#000000", "#ffffff");
    } else {
        alert("Please fill in at least one field for the restaurant order system.");
    }
});

// Attach Download and Share functionality to each section
downloadQR(downloadBtn, qrBody);
shareQR(shareBtn, qrBody);

downloadQR(downloadCustomBtn, customQrBody);
downloadQR(downloadRestroBtn, restroQrBody);