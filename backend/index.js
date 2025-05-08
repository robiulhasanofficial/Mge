require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://robiulhasanofficial.github.io", // আপনার আসল ফ্রন্টএন্ড URL ব্যবহার করুন
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

const SECRET_CODE = process.env.SECRET_CODE;
const users = {};

// ✅ হেলথ চেক রুট
app.get("/", (req, res) => {
  res.send("✅ Server is running");
});

// ✅ MongoDB সংযোগ
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("✅ Connected to MongoDB");
}).catch((err) => {
  console.error("❌ MongoDB connection error:", err);
  process.exit(1);
});

// ✅ মেসেজ স্কিমা ও মডেল
const messageSchema = new mongoose.Schema({
  sender: String,
  content: String,
  type: { type: String, default: "text" },
  timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model("Message", messageSchema);

// ✅ Socket.io হ্যান্ডলিং
io.on("connection", async (socket) => {
  console.log("🟢 User connected:", socket.id);

  // MongoDB থেকে পুরনো মেসেজগুলো লোড করা
  const oldMessages = await Message.find().sort({ timestamp: 1 }).limit(100);
  socket.emit("message history", oldMessages);

  // ইউজার রেজিস্ট্রেশন
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

  // চ্যাট মেসেজ হ্যান্ডলিং
  socket.on("chat message", async (msg) => {
    const newMsg = new Message({
      sender: msg.sender,     // ✅ পরিবর্তন
    content: msg.content,   // ✅ পরিবর্তন

      type: "text",
      timestamp: new Date()
    });
    await newMsg.save();
    io.emit("chat message", newMsg);
  });

  // চ্যাট মিডিয়া (ইমেজ/ভিডিও) হ্যান্ডলিং
  socket.on("chat media", async (media) => {
    const newMedia = new Message({
      sender: media.username,
      content: media.data,
      type: media.type,
      timestamp: new Date()
    });
    await newMedia.save();
    io.emit("chat media", newMedia);
  });

  // ডিসকানেক্ট হ্যান্ডলিং
  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
    delete users[socket.id];
    io.emit("user list", Object.values(users));
    io.emit("active users", Object.keys(users).length);
  });

  socket.on('error', (err) => {
    console.error('Socket error:', err);
  });
});

// ✅ সার্ভার চালু
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
