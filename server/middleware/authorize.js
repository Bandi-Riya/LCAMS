const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role_name) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    if (!allowedRoles.includes(req.user.role_name)) {
      return res.status(403).json({ message: "Access Denied." });
    }

    next();
  };
};

module.exports = authorize;
