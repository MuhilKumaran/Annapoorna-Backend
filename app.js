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

const nodemailer = require("nodemailer");

// Example POST route for sending contact us email
app.post("/contactUs", async (req, res) => {
  try {
    const { name, mobile, message } = req.body;

    // Create a transport object with Gmail configuration
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "muhilkumaran@gmail.com",
        pass: "lkmvwumfkxzfblxe",
      },
    });

    // Define the HTML content for the email
    const htmlContent = `
      <html>
      <head>
        <style>
          .email-body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
          }
          .header {
            background-color: #f4f4f4;
            padding: 10px;
            text-align: center;
          }
          .content {
            margin: 20px;
          }
          .footer {
            text-align: center;
            font-size: 0.8em;
            color: #888;
          }
        </style>
      </head>
      <body>
        <div class="email-body">
          <div class="header">
            <h2>Contact Us</h2>
          </div>
          <div class="content">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Mobile:</strong> ${mobile}</p>
            <p><strong>Message:</strong></p>
            <p>${message}</p>
          </div>
          <div class="footer">
            <p>Thank you for reaching out!</p>
          </div>
        </div>
      </body>
      </html>
    `;


    const mailOptions = {
      from: "muhilkumaran@gmail.com",
      to: "kumaranmuhil@gmail.com",
      subject: "Contact Us Form Submission",
      html: htmlContent,
    };


    await new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) return reject(error);
        resolve(info);
      });
    });
    
    // Respond with success message
    return res
      .status(200)
      .json({ status: "success", message: "Email Sent Successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: "fail", message: "Failed to Send Email" });
  }
});

module.exports = app;
