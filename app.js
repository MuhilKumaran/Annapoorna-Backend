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

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const razorpay = new Razorpay({
  key_id: "rzp_test_ITEcwgoKbDn0pJ",
  key_secret: "oiQ3JcydAxqfWFMeq6mhJkg4",
});

app.use("/menus", menuRoutes);
app.use("/customers", customerRoutes);
app.use("/admin", adminRoutes);

// app.post("/getdetails", async (req, res) => {
//   const {mobile} = req.body;
//   const sqlQuery = `SELECT
//           customers.name,
//           customers.mobile,
//           customers.email,
//           customers.password,
//           login_otp.otp,
//           login_otp.expiresAt
//       FROM
//           customers
//       JOIN
//           login_otp
//       ON
//           customers.mobile = login_otp.mobile
//       WHERE
//           login_otp.mobile = ?;
//   `;
//   db.query(sqlQuery, [mobile], (error, results) => {
//     if (error) {
//       return res.status(500).json({ error: error.message });
//     }
//     if (results.length === 0) {
//       return res.status(404).json({ message: "No record found" });
//     }
//     const user = results[0];
//     console.log(user.name+" "+user.mobile+" "+user.email+" "+user.otp+" ");

//     res.json(results);
//   });
// });

// app.post("/create-order", async (req, res) => {
//   try {
//     const { amount } = req.body;
//     var instance = new Razorpay({
//       key_id: "YOUR_KEY_ID",
//       key_secret: "YOUR_SECRET",
//     });

//     const options = {
//       amount: amount * 100,
//       currency: "INR",
//       receipt: "receipt#1",
//     };

//     let order = await instance.orders.create(options);

//     return res.status(201).json({ success: true, order, amount });
//   } catch (error) {
//     return res.status(400).json({ error });
//   }
// });


module.exports = app;
