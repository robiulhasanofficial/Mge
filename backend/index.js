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
      sender: msg.username,          // ✅ ঠিক করা
      content: msg.text,             // ✅ ঠিক করা
      type: "text",
      timestamp: new Date()          // timestamp সহ দিলে ভালো হয়
    });
    await newMsg.save();
    io.emit("chat message", newMsg);
  });

  socket.on("chat media", async (media) => {
    console.log("📷 Media received:", media);
    const newMedia = new Message({
      sender: media.username,        // ✅ ঠিক করা
      content: media.data,           // ✅ ঠিক করা
      type: media.type,
      timestamp: new Date()
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

  socket.on('error', (err) => {
    console.error('Socket error:', err);
  });
});
