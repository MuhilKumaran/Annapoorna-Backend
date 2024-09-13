const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const Razorpay = require("razorpay");
const bodyParser = require("body-parser");
const customerRoutes = require("./Routes/customerRoutes");
const menuRoutes = require("./Routes/menuRoutes");
const db = require("./Modules/mysql");
const adminRoutes = require("./Routes/adminRoutes");
const path = require("path");
const pdf = require("html-pdf");
const authenticate = require("./Modules/auth");
const nodemailer = require("nodemailer");
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://annapoorna-mithais.onrender.com",
    ], // or your production frontend URL
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use("/menus", menuRoutes);
app.use("/customers", customerRoutes);
app.use("/admin", adminRoutes);

module.exports = app;
