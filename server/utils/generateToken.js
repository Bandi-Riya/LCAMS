const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  return jwt.sign(
    {
      user_id: user._id,
      role_id: user.role_id?._id || user.role_id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );
};

module.exports = generateToken;
