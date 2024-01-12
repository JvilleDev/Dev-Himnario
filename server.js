const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();
const http = require("http");
const server = http.createServer(app);
const io = require("socket.io")(server);
const PORT = 5000;
app.use(express.static(path.join(__dirname, "dist")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
io.on("connection", (socket) => {
  socket.on("newLine", (data) => {
    io.emit("Line", data);
  });

  socket.on("newSong", (data) => {
    io.emit("Song", data);
  });
  socket.on("newIndex", (data) => {
    io.emit("Index", data);
    console.log(`Índice recibido: ${data}`)
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "base", "index.html"));
});
app.get("/lista", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "base", "lista.html"));
});
app.get("/ver", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "base", "ver.html"));
});

const filePath = path.join(__dirname, "public", "cantos.json");
app.get("/canto/:id", (req, res) => {
  const cantoId = parseInt(req.params.id);

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Internal server error" });
    }

    let cantos = [];
    try {
      cantos = JSON.parse(data);
    } catch (error) {
      return res.status(500).json({ error: "Error parsing JSON" });
    }

    const canto = cantos.find((canto) => canto.id === cantoId);

    if (canto) {
      return res.status(200).json(canto);
    } else {
      return res.status(404).json({ error: "Canto not found" });
    }
  });
});

app.post("/add", (req, res) => {
  const { title, content, type, nH } = req.body;
  if (!title || !content || !type) {
    return res
      .status(400)
      .json({ error: "Title, content, and type are required" });
  }

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Internal server error" });
    }

    let cantos = [];
    try {
      cantos = JSON.parse(data);
    } catch (error) {
      return res.status(500).json({ error: "Error parsing JSON" });
    }

    const newCanto = {
      id: cantos.length + 1,
      title,
      content,
      type,
      nH,
    };

    cantos.push(newCanto);

    fs.writeFile(filePath, JSON.stringify(cantos, null, 4), (err) => {
      if (err) {
        return res.status(500).json({ error: "Error writing to file" });
      }
      return res
        .status(200)
        .json({ message: "Canto added successfully", canto: newCanto });
    });
  });
});
app.put("/canto/:id", (req, res) => {
  const cantoId = parseInt(req.params.id);
  const { title, content, type, nH } = req.body;

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Internal server error" });
    }

    let cantos = [];
    try {
      cantos = JSON.parse(data);
    } catch (error) {
      return res.status(500).json({ error: "Error parsing JSON" });
    }

    const cantoIndex = cantos.findIndex((canto) => canto.id === cantoId);

    if (cantoIndex === -1) {
      return res.status(404).json({ error: "Canto not found" });
    }
    cantos[cantoIndex].title = title;
    cantos[cantoIndex].content = content;
    cantos[cantoIndex].type = type;
    cantos[cantoIndex].nH = nH;

    fs.writeFile(filePath, JSON.stringify(cantos, null, 4), (err) => {
      if (err) {
        return res.status(500).json({ error: "Error writing to file" });
      }
      return res
        .status(200)
        .json({
          message: "Canto updated successfully",
          canto: cantos[cantoIndex],
        });
    });
  });
});
app.delete("/canto/:id", (req, res) => {
  const cantoId = parseInt(req.params.id);

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Internal server error" });
    }

    let cantos = [];
    try {
      cantos = JSON.parse(data);
    } catch (error) {
      return res.status(500).json({ error: "Error parsing JSON" });
    }

    const cantoIndex = cantos.findIndex((canto) => canto.id === cantoId);

    if (cantoIndex === -1) {
      return res.status(404).json({ error: "Canto not found" });
    }
    cantos.splice(cantoIndex, 1);

    fs.writeFile(filePath, JSON.stringify(cantos, null, 4), (err) => {
      if (err) {
        return res.status(500).json({ error: "Error writing to file" });
      }
      return res.status(200).json({ message: "Canto deleted successfully" });
    });
  });
});

server.listen(PORT, () => {
  console.log(`Himnario ejecutándose en http://localhost:${PORT}`);
});
