const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../db.js");
const zod = require("zod");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");
const { authMiddleware } = require("../middleware");
const router = express.Router();
const signupSchema = zod.object({
  username: zod.string().email(),
  password: zod.string().min(8),
  firstName: zod.string().max(15),
  lastName: zod.string().max(15),
});

router.post("/signup", async (req, res) => {
  const result = signupSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({ message: "Invalid input" });
  }

  const { username, password, firstName, lastName } = result.data;

  try {
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(409).json({ message: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      password: hashedPassword,
      firstName,
      lastName,
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: "1h" }
    );
    console.log(token);

    res.status(201).json({
      message: "User created successfully",
      token: token,
      userId: user._id,
    });
  } catch (error) {
    res.status(500).json({ message: "Error Creating new User" });
  }
});

const signinSchema = zod.object({
  username: zod.string().email(),
  password: zod.string().min(8),
});

router.post("/signin", async (req, res) => {
  const { result } = signinSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: "Invalid input" });
  }

  const { username, password } = result.data;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Signed in successfully",
      token: token,
      userId: user._id,
    });
  } catch (error) {
    res.status(500).json({ message: "Error during signin" });
  }
});

const updateUserSchema = zod.object({
  firstName: zod.string().max(15),
  lastName: zod.string().max(15),
  password: zod.string().min(8),
});

router.put("/", authMiddleware, async (req, res) => {
  const { result } = updateUserSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: "Invalid input" });
  }
  const { firstName, lastName, password } = result.data;

  const user = await User.updateOne(
    { _id: req.user.userId },
    { firstName, lastName, password }
  );

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  res.json({ message: "User updated successfully" });
  console.log(user);
});

module.exports = router;
