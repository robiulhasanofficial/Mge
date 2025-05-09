const socket = io("https://mge-2.onrender.com", {
  transports: ["websocket", "polling"]
});
// Active users count
socket.on("active users", (count) => {
  activeUsersElement.textContent = `Active Users: ${count}`;
});

const form = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const fileInput = document.getElementById('file-input');
const messages = document.getElementById('messages');
const emojiBtn = document.getElementById('emoji-button');
const emojiPicker = document.getElementById('emoji-picker');
const activeUsersElement = document.getElementById('active-users');

const SECRET_CODE = "CCCDS999";
let username = localStorage.getItem("username");
let code = localStorage.getItem("code");

// Request notification permission
if ("Notification" in window && Notification.permission !== "granted") {
  Notification.requestPermission();
}

// Register user
if (!username || code !== SECRET_CODE) {
  username = prompt("Enter your name:") || "Anonymous";
  code = prompt("Enter secret code:") || "";

  if (code === SECRET_CODE) {
    localStorage.setItem("username", username);
    localStorage.setItem("code", code);
    socket.emit("register", { username, code });
  } else {
    alert("Invalid code. Access denied.");
    document.body.innerHTML = "<h2 style='text-align:center; color:red;'>Unauthorized Access</h2>";
    throw new Error("Unauthorized");
  }
} else {
  socket.emit("register", { username, code });
}

// Message history
socket.on("message history", (messagesArray) => {
  messagesArray.forEach(displayMessage);
  forceScrollToBottom();
});

// New text message received
socket.on("chat message", (msg) => {
  displayMessage(msg);
  forceScrollToBottom();

  if (msg.sender !== username && Notification.permission === "granted") {
    new Notification(`${msg.sender}`, {
      body: msg.content,
      icon: "/images/logo.png"
    });
  }
});

// New media received
socket.on("chat media", (media) => {
  const li = document.createElement("li");
  li.classList.add("message", media.sender === username ? "own" : "other");

  let content = `<strong>${media.sender}</strong><br>`;
  if (media.type === "image") {
    content += `<img src="${media.content}" style="max-width: 200px; border-radius: 8px;" />`;
  } else if (media.type === "video") {
    content += `<video src="${media.content}" controls style="max-width: 250px; border-radius: 8px;"></video>`;
  }
  content += `<br><small>${media.timestamp}</small>`;
  li.innerHTML = content;

  messages.appendChild(li);
  forceScrollToBottom();

  if (media.sender !== username && Notification.permission === "granted") {
    new Notification(`${media.sender} sent a ${media.type}`, {
      icon: "/logo/logo.png"
    });
  }
});
// Send message or media
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const text = messageInput.value.trim();
  const file = fileInput.files[0];

  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      const type = file.type.startsWith("image")
        ? "image"
        : file.type.startsWith("video")
        ? "video"
        : "unknown";

      if (type === "unknown") {
        alert("Only image and video files are supported.");
        return;
      }

      socket.emit("chat media", {
        sender: username,
        type,
        content: reader.result,
        timestamp: new Date().toLocaleTimeString()
      });
    };
    reader.readAsDataURL(file);
    fileInput.value = "";
  }

  if (text) {
    socket.emit("chat message", {
      sender: username,
      content: text,
      timestamp: new Date().toLocaleTimeString()
    });
    messageInput.value = "";
  }
});

// Display message
// Display message
function displayMessage(msg) {
  const li = document.createElement("li");
  li.classList.add("message", msg.sender === username ? "own" : "other");
  li.innerHTML = `<strong>${msg.sender}</strong>: ${msg.content}<br><small>${msg.timestamp}</small>`;
  messages.appendChild(li); // ✅ মেসেজ DOM এ যুক্ত করো
}



// Auto scroll
function forceScrollToBottom() {
  setTimeout(() => {
    messages.scrollTop = messages.scrollHeight;
  }, 100);
}

// Emoji picker
emojiBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  emojiPicker.style.display = emojiPicker.style.display === "none" ? "block" : "none";
});

emojiPicker.addEventListener("emoji-click", (event) => {
  messageInput.value += event.detail.unicode;
  emojiPicker.style.display = "none";
});

document.addEventListener("click", (e) => {
  if (!emojiBtn.contains(e.target) && !emojiPicker.contains(e.target)) {
    emojiPicker.style.display = "none";
  }
});

// New listener for registration success/failure
socket.on("register_success", (msg) => {
  console.log("✅", msg);
});

socket.on("register_failed", (msg) => {
  console.error("❌", msg);
  alert("Registration failed: " + msg);
});
