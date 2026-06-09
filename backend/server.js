require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");

const db = require("./database");
const app = express();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    project: "SmartPavement Guard API"
  });
});

app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email y contraseña requeridos"
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  db.run(
    "INSERT INTO users(email, password) VALUES(?, ?)",
    [email, hashedPassword],
    function (err) {
      if (err) {
        return res.status(500).json({
          error: err.message
        });
      }

      res.json({
        success: true,
        userId: this.lastID
      });
    }
  );
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.get(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, user) => {
      if (err) {
        return res.status(500).json(err);
      }

      if (!user) {
        return res.status(404).json({
          message: "Usuario no encontrado"
        });
      }

      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        return res.status(401).json({
          message: "Contraseña incorrecta"
        });
      }

      res.json({
        success: true,
        userId: user.id,
        email: user.email
      });
    }
  );
});

app.post("/manual-report", upload.single("photo"), (req, res) => {
  const { userId, description, latitude, longitude } = req.body;

  const imageUrl = req.file
    ? `/uploads/${req.file.filename}`
    : null;

  db.run(
    `
    INSERT INTO manual_reports(
      user_id,
      description,
      image_url,
      latitude,
      longitude
    )
    VALUES(?,?,?,?,?)
    `,
    [
      userId,
      description,
      imageUrl,
      latitude,
      longitude
    ],
    function(err) {
      if (err) {
        return res.status(500).json(err);
      }

      res.json({
        success: true,
        reportId: this.lastID,
        imageUrl
      });
    }
  );
});

app.post("/automatic-report", (req, res) => {
  const { userId, impact, speed, latitude, longitude } = req.body;

  db.run(
    `
    INSERT INTO automatic_reports(
      user_id,
      impact,
      speed,
      latitude,
      longitude
    )
    VALUES(?,?,?,?,?)
    `,
    [userId, impact, speed, latitude, longitude],
    function(err) {
      if (err) {
        return res.status(500).json(err);
      }

      res.json({
        success: true,
        reportId: this.lastID
      });
    }
  );
});

app.get("/automatic-reports", (req, res) => {
  db.all(
    "SELECT * FROM automatic_reports ORDER BY id DESC",
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json(err);
      }

      res.json(rows);
    }
  );
});

app.get("/reports", (req, res) => {
  db.all(
    "SELECT * FROM manual_reports ORDER BY id DESC",
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json(err);
      }

      res.json(rows);
    }
  );
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Servidor iniciado en puerto ${PORT}`);
});