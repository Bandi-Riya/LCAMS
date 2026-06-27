const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ message: "Unauthorized. Token missing." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.user_id).populate("role_id", "role_name permissions");

    if (!user || !user.is_active) {
      return res.status(401).json({ message: "Unauthorized user." });
    }

    req.user = {
      _id: user._id,
      id: user._id,
      email: user.email,
      username: user.username,
      role_id: user.role_id?._id,
      role_name: user.role_id?.role_name,
    };

    next();
  } catch (_error) {
    return res.status(401).json({ message: "Unauthorized. Invalid token." });
  }
};

module.exports = authMiddleware;
