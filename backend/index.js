const cors = require("cors");
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const { Server } = require("socket.io");

app.use(cors({
  origin: "https://robiulhasanofficial.github.io",
  methods: ["GET", "POST"]
}));

const io = new Server(http, {
  cors: {
    origin: "https://robiulhasanofficial.github.io",
    methods: ["GET", "POST"]
  }
});

app.use(express.json());

const users = {};
const fixedPassword = "your_secret_password"; // নির্দিষ্ট পাসওয়ার্ড

io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  // ইউজার রেজিস্টার করা
  socket.on("register", ({ username, password }) => {
    if (password === fixedPassword) {
      users[socket.id] = username;
      console.log(`👤 ${username} joined.`);
      io.emit("user list", Object.values(users));
    } else {
      socket.emit("error", "Invalid password"); // পাসওয়ার্ড ভুল হলে মেসেজ পাঠানো
      socket.disconnect(); // সংযোগ বন্ধ করা
    }
  });

  socket.on("chat message", (msg) => {
    console.log("💬 Message:", msg);
    io.emit("chat message", msg);
  });

  socket.on("chat media", (media) => {
    console.log("📷 Media received:", media);
    io.emit("chat media", media);
  });

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
    delete users[socket.id];
    io.emit("user list", Object.values(users));
  });
});

const PORT = process.env.PORT || 5000;
http.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
