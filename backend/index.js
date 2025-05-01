const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
      origin: "https://robiulhasanofficial.github.io/Mge/frontend/index.html", // ✅ শুধুমাত্র তোমার GitHub Pages frontend URL
      methods: ["GET", "POST"]
    }
  });
  

app.use(cors());
app.use(express.json());

const users = {};

io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  socket.on("register", (username) => {
    users[socket.id] = username;
    console.log(`👤 ${username} joined.`);
    io.emit("user list", Object.values(users));
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
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
