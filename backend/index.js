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

const SECRET_CODE = "CCCDS999"; // ✅ গোপন কোড
const users = {};
const messages = [];

io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  // আগের মেসেজ পাঠানো
  socket.emit("message history", messages);

  // ✅ রেজিস্ট্রেশনের সময় ইউজারের নাম ও কোড চেক করা হবে
  socket.on("register", ({ username, code }) => {
    if (code !== SECRET_CODE) {
      socket.emit("register_failed", "❌ Invalid code");
      console.log(`🚫 ${username} failed to join (wrong code)`);
      return;
    }

    users[socket.id] = username;
    console.log(`👤 ${username} joined.`);
    socket.emit("register_success", "✅ Registered successfully");
    io.emit("user list", Object.values(users));
  });

  socket.on("chat message", (msg) => {
    console.log("💬 Message:", msg);
    messages.push(msg);
    io.emit("chat message", msg);
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
