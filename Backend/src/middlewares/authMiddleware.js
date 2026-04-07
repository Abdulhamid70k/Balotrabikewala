import jwt from "jsonwebtoken";

// Protect — verify JWT, attach static user
export const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Single account — no DB lookup needed
    req.user = {
      _id: "admin_001",
      name: process.env.ADMIN_NAME || "Admin",
      username: process.env.ADMIN_USERNAME,
      role: decoded.role || "admin",
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token expired.", code: "TOKEN_EXPIRED" });
    }
    return res.status(401).json({ success: false, message: "Invalid token." });
  }
};

// Authorize by role
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }
    next();
  };
};