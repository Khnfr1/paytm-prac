const express = require("express");
// import { Router } from "express"; // ES6+
const router = express.Router();

router.get("/", (req, res) => {
  res.send("User Home Page");
});

router.get("/profile", (req, res) => {
  res.send("User Profile Page");
});

router.get("/settings", (req, res) => {
  res.send("User Settings Page");
});

module.exports = router;
