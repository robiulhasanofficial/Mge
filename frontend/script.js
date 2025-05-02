const socket = io("https://mge-2.onrender.com", {
  transports: ["websocket", "polling"]
});

const form = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const fileInput = document.getElementById('file-input');
const messages = document.getElementById('messages');
const emojiBtn = document.getElementById('emoji-button');
const emojiPicker = document.getElementById('emoji-picker');

const SECRET_CODE = "CCCDS999";

let username = localStorage.getItem("username");
let code = localStorage.getItem("code");

// User Authentication
if (!username || code !== SECRET_CODE) {
  username = prompt("Enter your name:") || "Anonymous";
  code = prompt("Enter secret code:") || "";

  if (code === SECRET_CODE) {
    localStorage.setItem("username", username);
    localStorage.setItem("code", code);
    socket.emit("register", username);
  } else {
    alert("Invalid code. Access denied.");
    document.body.innerHTML = "<h2 style='text-align:center; color:red;'>Unauthorized Access</h2>";
    throw new Error("Unauthorized");
  }
} else {
  socket.emit("register", username);
}

// Load message history
socket.on("message history", (messagesArray) => {
  messagesArray.forEach(displayMessage);
  forceScrollToBottom();
});

// New text message
socket.on("chat message", (msg) => {
  displayMessage(msg);
  forceScrollToBottom();
});

// New media message
socket.on("chat media", (media) => {
  const li = document.createElement("li");
  li.classList.add("message", media.username === username ? "own" : "other");

  let content = `<strong>${media.username}</strong><br>`;
  if (media.type === "image") {
    content += `<img src="${media.data}" style="max-width: 200px; border-radius: 8px;" />`;
  } else if (media.type === "video") {
    content += `<video src="${media.data}" controls style="max-width: 250px; border-radius: 8px;"></video>`;
  }
  content += `<br><small>${media.timestamp}</small>`;
  li.innerHTML = content;

  messages.appendChild(li);
  forceScrollToBottom();
});

// Send message or file
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
        username,
        timestamp: new Date().toLocaleTimeString(),
        type,
        data: reader.result
      });
    };
    reader.readAsDataURL(file);
    fileInput.value = "";
  }

  if (text) {
    socket.emit("chat message", {
      username,
      text,
      timestamp: new Date().toLocaleTimeString()
    });
    messageInput.value = "";
  }
});

// Display a message
function displayMessage(msg) {
  const li = document.createElement("li");
  li.classList.add("message", msg.username === username ? "own" : "other");
  li.innerHTML = `<strong>${msg.username}</strong>: ${msg.text}<br><small>${msg.timestamp}</small>`;
  messages.appendChild(li);
}

// Scroll to bottom
function forceScrollToBottom() {
  setTimeout(() => {
    messages.scrollTop = messages.scrollHeight;
  }, 100);
}

// Emoji picker handling
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

// Infinite Scroll Implementation
let isLoading = false;

messages.addEventListener('scroll', () => {
  if (!isLoading && messages.scrollTop === 0) {
    isLoading = true; // Prevent multiple fetches
    loadOlderMessages(); // Call a function to load older messages
  }
});

function loadOlderMessages() {
  // Simulate fetching older messages
  setTimeout(() => {
    const newMessage = document.createElement("li");
    newMessage.textContent = "Older message " + new Date().toLocaleTimeString();
    messages.insertBefore(newMessage, messages.firstChild);
    isLoading = false; // Allow further scroll triggers
  }, 1000);
}
