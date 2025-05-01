const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://robiulhasanofficial.github.io/Mge/frontend/",  // এখানে আপনার Frontend URL দিন
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Store connected users
const users = {};

io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  // রেজিস্ট্রেশন
  socket.on("register", (username) => {
    users[socket.id] = username;
    console.log(`👤 ${username} joined.`);
    io.emit("user list", Object.values(users));
  });

  // টেক্সট মেসেজ
  socket.on("chat message", (msg) => {
    console.log("💬 Message:", msg);
    io.emit("chat message", msg);
  });

  // মিডিয়া ফাইল
  socket.on("chat media", (media) => {
    console.log("📷 Media received:", media);
    io.emit("chat media", media);
  });

  // ডিসকানেক্ট
  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
    delete users[socket.id];
    io.emit("user list", Object.values(users));
  });
});

// Run server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
