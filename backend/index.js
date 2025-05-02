const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const app = express();
const http = require("http").createServer(app); // ✅ fixed here
const { Server } = require("socket.io");

const io = new Server(http, {
  cors: {
    origin: "https://robiulhasanofficial.github.io",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

const SECRET_CODE = "CCCDS999";
const users = {};

// MongoDB সংযোগ
mongoose.connect("mongodb+srv://hasanjehad668:jehadhasan999@cluster0.vbdrzey.mongodb.net/chatDB?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("✅ Connected to MongoDB");
}).catch((err) => {
  console.error("❌ MongoDB connection error:", err);
});

// মেসেজ স্কিমা
const messageSchema = new mongoose.Schema({
  sender: String,
  content: String,
  type: { type: String, default: "text" },
  timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model("Message", messageSchema);

// Socket.io হ্যান্ডলিং
io.on("connection", async (socket) => {
  console.log("🟢 User connected:", socket.id);

  const oldMessages = await Message.find().sort({ timestamp: 1 }).limit(100);
  socket.emit("message history", oldMessages);

  socket.on("register", ({ username, code }) => {
    if (code !== SECRET_CODE) {
      socket.emit("register_failed", "❌ Invalid code");
      return;
    }

    users[socket.id] = username;
    socket.emit("register_success", "✅ Registered successfully");
    io.emit("user list", Object.values(users));
    io.emit("active users", Object.keys(users).length);
  });

  socket.on("chat message", async (msg) => {
    console.log("💬 Message:", msg);

    const newMsg = new Message({
      sender: msg.sender,
      content: msg.content,
      type: "text"
    });
    await newMsg.save();

    io.emit("chat message", newMsg);
  });

  socket.on("chat media", async (media) => {
    console.log("📷 Media received:", media);

    const newMedia = new Message({
      sender: media.sender,
      content: media.content,
      type: "media"
    });
    await newMedia.save();

    io.emit("chat media", newMedia);
  });

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
    delete users[socket.id];
    io.emit("user list", Object.values(users));
    io.emit("active users", Object.keys(users).length);
  });
});

const PORT = process.env.PORT || 5000;
http.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
