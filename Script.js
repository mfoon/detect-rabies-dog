// script.js — Menampilkan hasil deteksi dari YOLO ke canvas
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const btnStart = document.getElementById("btnStart");
const btnStop = document.getElementById("btnStop");
let video;
let stream;
let detectInterval;
let alertTriggered = false;

btnStart.onclick = async () => {
  try {
    video = document.createElement("video");
    video.setAttribute("autoplay", "");
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;

    video.onloadedmetadata = () => {
      video.play();
      detectLoop();
      btnStart.disabled = true;
      btnStop.disabled = false;
    };
  } catch (err) {
    alert("Gagal mengakses kamera: " + err);
  }
};

btnStop.onclick = () => {
  clearInterval(detectInterval);
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  alertTriggered = false;
  btnStart.disabled = false;
  btnStop.disabled = true;
};
function detectLoop() {
  detectInterval = setInterval(() => {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const image = canvas.toDataURL("image/jpeg");
    fetch("/detect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image }),
    })
      .then((res) => res.json())
      .then(drawDetections)
      .catch((err) => console.error(err));
  }, 700);
}

function drawDetections(data) {
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "lime";
  ctx.lineWidth = 2;
  ctx.font = "16px Arial";
  ctx.fillStyle = "lime";

  let rabiesDetected = false;

  data.forEach((obj) => {
    const x = obj.xmin;
    120;
    const y = obj.ymin;
    90;
    const width = obj.xmax - obj.xmin;
    240;
    const height = obj.ymax - obj.ymin;
    200;

    ctx.strokeRect(x, y, width, height);
    ctx.fillText(
      `${obj.name} (${(obj.confidence * 100).toFixed(1)}%)`,
      x,
      y - 5
    );

    if (obj.name.toLowerCase().includes("rabies") && obj.confidence > 0.5) {
      rabiesDetected = true;
    }
  });

  if (rabiesDetected && !alertTriggered) {
    alertTriggered = true;
    alert(
      "🚨 Peringatan! Anjing rabies terdeteksi! Segera hubungi pihak Ditjen PKH."
    );

    const callButton = document.createElement("a");
    callButton.href = "tel:1500033";
    callButton.innerText = "Hubungi Ditjen PKH";
    callButton.style.display = "block";
    callButton.style.margin = "20px auto";
    callButton.style.padding = "12px 24px";
    callButton.style.background = "#ff0000";
    callButton.style.color = "#fff";
    callButton.style.textAlign = "center";
    callButton.style.textDecoration = "none";
    callButton.style.borderRadius = "8px";
    callButton.style.width = "max-content";
    callButton.style.fontSize = "18px";

    document.body.appendChild(callButton);
  }
}
