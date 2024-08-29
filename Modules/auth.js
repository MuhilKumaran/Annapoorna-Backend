require("dotenv").config({ path: "../config.env" });

const jwt = require("jsonwebtoken");
require("dotenv").config();
const SECRET_KEY = process.env.SECRET_KEY;


const authenticateAdmin = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Login to view the order" });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
    req.user = user; // Attach user data to the request object
    if(user.role!=="admin")
      return res.status(403).json({ message: "Access denied. Admins only." });
    next();
  });
};



const authenticateCustomer = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "Login to view the order" });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
    req.user = user; // Attach user data to the request object

    if(user.role!=="customer")
        return res.status(403).json({ message: "Access denied. Admins only." });
    next();
  });
};

module.exports = authenticateToken;
