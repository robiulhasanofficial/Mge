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

if (!username || code !== SECRET_CODE) {
  username = prompt("Enter your name:") || "Anonymous";
  code = prompt("Enter secret code:") || "";

  if (code === SECRET_CODE) {
    localStorage.setItem("username", username);
    localStorage.setItem("code", code);
    socket.emit("register", username);
  } else {
    alert("Invalid code. Access denied.");
    document.body.innerHTML = "<h2 style='text-align:center;'>Unauthorized access</h2>";
    throw new Error("Unauthorized");
  }
} else {
  socket.emit("register", username);
}

socket.on("message history", (messagesArray) => {
  messagesArray.forEach((msg) => displayMessage(msg));
  forceScrollToBottom();
});

socket.on('chat message', (msg) => {
  displayMessage(msg);
  forceScrollToBottom();
});

socket.on('chat media', (media) => {
  const li = document.createElement('li');
  li.classList.add('message', media.username === username ? 'own' : 'other');
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

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = messageInput.value.trim();
  const file = fileInput.files[0];

  if (file) {
    const reader = new FileReader();
    reader.onload = function () {
      const fileData = {
        username,
        timestamp: new Date().toLocaleTimeString(),
        type: file.type.startsWith("image") ? "image" : file.type.startsWith("video") ? "video" : "unknown",
        data: reader.result
      };
      if (fileData.type === "image" || fileData.type === "video") {
        socket.emit("chat media", fileData);
      } else {
        alert("Only image and video files are supported.");
      }
    };
    reader.readAsDataURL(file);
    fileInput.value = '';
  }

  if (text) {
    const msg = {
      username,
      text,
      timestamp: new Date().toLocaleTimeString(),
    };
    socket.emit('chat message', msg);
    messageInput.value = '';
  }
});

function displayMessage(msg) {
  const li = document.createElement('li');
  li.classList.add('message', msg.username === username ? 'own' : 'other');
  li.innerHTML = `<strong>${msg.username}</strong>: ${msg.text}<br><small>${msg.timestamp}</small>`;
  messages.appendChild(li);
}

function forceScrollToBottom() {
  setTimeout(() => {
    messages.scrollTop = messages.scrollHeight;
  }, 100);
}

emojiBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'block' : 'none';
});

emojiPicker.addEventListener('emoji-click', (event) => {
  messageInput.value += event.detail.unicode;
  emojiPicker.style.display = 'none';
});

document.addEventListener('click', (e) => {
  if (!emojiBtn.contains(e.target) && !emojiPicker.contains(e.target)) {
    emojiPicker.style.display = 'none';
  }
});
