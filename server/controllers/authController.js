const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { Role } = require("../models/Role");
const generateToken = require("../utils/generateToken");

const sanitizeUser = (userDoc) => ({
  id: userDoc._id,
  username: userDoc.username,
  email: userDoc.email,
  department: userDoc.department,
  is_active: userDoc.is_active,
  created_at: userDoc.created_at,
  role: userDoc.role_id
    ? {
        id: userDoc.role_id._id,
        role_name: userDoc.role_id.role_name,
        permissions: userDoc.role_id.permissions,
      }
    : null,
});

const register = async (req, res, next) => {
  try {
    const { username, email, password, department, role_name } = req.body;

    if (!username || !email || !password || !role_name) {
      return res.status(400).json({ message: "username, email, password, and role_name are required." });
    }

    const role = await Role.findOne({ role_name });
    if (!role) {
      return res.status(400).json({ message: "Invalid role_name." });
    }

    // Bootstrap rule:
    // - If there are no users, allow creating only an Admin account without token.
    // - Otherwise, only an authenticated Admin can create users.
    const userCount = await User.countDocuments();
    if (userCount === 0 && role_name !== "Admin") {
      return res.status(403).json({ message: "First registered user must be Admin." });
    }

    if (userCount > 0) {
      const authHeader = req.headers.authorization || "";
      const [scheme, token] = authHeader.split(" ");
      if (scheme !== "Bearer" || !token) {
        return res.status(403).json({ message: "Access Denied." });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const requester = await User.findById(decoded.user_id).populate("role_id", "role_name");
      if (!requester || !requester.is_active || requester.role_id?.role_name !== "Admin") {
        return res.status(403).json({ message: "Access Denied." });
      }
    }

    const duplicate = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username }] });
    if (duplicate) {
      return res.status(409).json({ message: "User with same email or username already exists." });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password_hash,
      department,
      role_id: role._id,
      is_active: true,
    });

    const hydrated = await User.findById(user._id).populate("role_id", "role_name permissions");
    return res.status(201).json({
      message: "User registered successfully.",
      user: sanitizeUser(hydrated),
    });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).populate("role_id", "role_name permissions");
    if (!user || !user.is_active) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = generateToken(user);
    return res.status(200).json({
      message: "Login successful.",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    return next(error);
  }
};

const me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate("role_id", "role_name permissions");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({ user: sanitizeUser(user) });
  } catch (error) {
    return next(error);
  }
};

const logout = async (_req, res) => {
  return res.status(200).json({
    message: "Logout successful. Remove token on client side or use token blacklist strategy.",
  });
};

module.exports = { register, login, me, logout };
