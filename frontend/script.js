const socket = io("https://mge-2.onrender.com", {
  transports: ["websocket", "polling"]
});

const form = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const fileInput = document.getElementById('file-input');
const messages = document.getElementById('messages');

const username = prompt("Enter your name:") || "Anonymous"; // ইউজারের নাম চাওয়া

// ফর্ম সাবমিট হলে
form.addEventListener('submit', (e) => {
  e.preventDefault(); // ফর্মের ডিফল্ট সাবমিট এ্যাকশন বন্ধ করা

  const text = messageInput.value.trim(); // মেসেজের টেক্সট
  const file = fileInput.files[0]; // ফাইল (ইমেজ/ভিডিও)

  // যদি ফাইল থাকে
  if (file) {
    const reader = new FileReader();
    
    reader.onload = function () {
      const fileData = {
        username,
        timestamp: new Date().toLocaleTimeString(),
        type: file.type.startsWith("image") ? "image" : file.type.startsWith("video") ? "video" : "unknown", // ফাইল টাইপ চেক করা
        data: reader.result
      };

      // মিডিয়া ফাইল (ইমেজ / ভিডিও) পাঠানো
      if (fileData.type === "image" || fileData.type === "video") {
        socket.emit("chat media", fileData);
      } else {
        alert("Only image and video files are supported.");
      }
    };

    reader.readAsDataURL(file); // ফাইলের ডাটা পড়া
    fileInput.value = ''; // ফাইল ইনপুট রিসেট করা
  }

  // যদি মেসেজ থাকে
  if (text) {
    const msg = {
      username,
      text,
      timestamp: new Date().toLocaleTimeString(),
    };
    socket.emit('chat message', msg); // মেসেজ সার্ভারে পাঠানো
    messageInput.value = ''; // ইনপুট ফিল্ড রিসেট করা
  }
});

// টেক্সট মেসেজ রিসিভ করা
socket.on('chat message', (msg) => {
  const li = document.createElement('li');
  li.classList.add('message');
  
  if (msg.username === username) {
    li.classList.add('own');
  } else {
    li.classList.add('other');
  }

  li.innerHTML = `<strong>${msg.username}</strong>: ${msg.text}<br><small>${msg.timestamp}</small>`;
  messages.appendChild(li);
  messages.scrollTop = messages.scrollHeight;
});

// ইমেজ / ভিডিও রিসিভ করা
socket.on('chat media', (media) => {
  const li = document.createElement('li');
  li.classList.add('message');
  
  if (media.username === username) {
    li.classList.add('own');
  } else {
    li.classList.add('other');
  }

  let content = `<strong>${media.username}</strong><br>`;

  if (media.type === "image") {
    content += `<img src="${media.data}" style="max-width: 200px; border-radius: 8px;" />`;
  } else if (media.type === "video") {
    content += `<video src="${media.data}" controls style="max-width: 250px; border-radius: 8px;"></video>`;
  }

  content += `<br><small>${media.timestamp}</small>`;
  li.innerHTML = content;

  messages.appendChild(li);
  messages.scrollTop = messages.scrollHeight;
});