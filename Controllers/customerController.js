require("dotenv").config({ path: "../config.env" });
const db = require("../Modules/mysql");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.SECRET_KEY;
const Razorpay = require("razorpay");

//messaging
const twilio = require("twilio");
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_KEY);
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.signupCustomer = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const hashPassword = await bcrypt.hash(password, 10);
    const sql =
      "INSERT INTO customers (name,phone,email,password) VALUES (?,?,?,?)";
    const result = await new Promise((resolve, reject) => {
      db.query(sql, [name, phone, email, hashPassword], (err, result) => {
        if (err) {
          return reject(err);
        }
        resolve(result);
      });
    });

    return res.status(201).json({
      status: true,
      type: "Sign Up",
      message: "Sign Up Successful",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ status: false, message: "Error inserting customer details" });
  }
};

exports.sendOTP = async (req, res) => {
  console.log(req.body);
  const { mobileNumber } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP


  const expiresAt = new Date(Date.now() + 5 * 60 * 1000)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

  try {
    const sql = `INSERT INTO login_otp (mobile, otp, expiresAt) 
                 VALUES (?, ?, ?)  
                 ON DUPLICATE KEY UPDATE 
                 otp = VALUES(otp), expiresAt = VALUES(expiresAt)`;

    const result = await new Promise((resolve, reject) => {
      db.query(sql, [mobileNumber, otp, expiresAt], (err, result) => {
        if (err) {
          return reject(err);
        }
        resolve(result);
      });
    });

    await client.messages.create({
      body: `Your OTP is ${otp}`,
      from: "+12568587594",
      to: "+91" + mobileNumber,
    });
    return res.status(200).send("OTP sent successfully");
  } catch (error) {
    console.log(error);
    return res.status(500).send("Failed to send OTP");
  }
};

// exports.verifyOtp = async (req, res) => {
//   console.log("hii");
//   console.log(req.body);
//   const { mobileNumber, otp } = req.body;

//   try {
//     const sql = `SELECT 
//           customers.name, 
//           customers.mobile, 
//           customers.email, 
//           customers.password, 
//           customers.role,
//           login_otp.otp, 
//           login_otp.expiresAt
//       FROM 
//           customers
//       JOIN 
//           login_otp 
//       ON 
//           customers.mobile = login_otp.mobile
//       WHERE 
//           login_otp.mobile = ?`;

//     const result = await new Promise((resolve, reject) => {
//       db.query(sql, [mobileNumber], (err, result) => {
//         if (err) {
//           return reject(err);
//         }
//         resolve(result);
//       });
//     });

//     if (result.length === 0) {
//       return res.status(404).json({ status: false, message: "OTP not found" });
//     }

//     const userRecord = result[0];
//     console.log(userRecord);
//     const currentDate = new Date(Date.now())
//       .toISOString()
//       .slice(0, 19)
//       .replace("T", " ");

//     if (new Date(userRecord.expiresAt) < currentDate) {
//       return res.status(400).json({ status: false, message: "OTP expired" });
//     }

//     if (userRecord.otp !== otp) {
//       return res.status(400).json({ status: false, message: "Invalid OTP" });
//     }

//     const token = jwt.sign(
//       {
//         userName: userRecord.name,
//         email: userRecord.email,
//         mobile: userRecord.mobile,
//         role: userRecord.role,
//       },
//       SECRET_KEY,
//       {
//         expiresIn: "1h",
//       }
//     );

//     res.cookie(
//       "token",
//       token,
//       {
//         userName: userRecord.name,
//         email: userRecord.email,
//         mobile: userRecord.mobile,
//         role: userRecord.role,
//       },
//       {
//         httpOnly: true,
//         secure: true, // Set to true if using HTTPS on backend
//         sameSite: "None",
//       }
//     );

//     const deleteSQL = `DELETE FROM login_otp WHERE mobile = ?`;
//     const deleteResult = await new Promise((resolve, reject) => {
//       db.query(deleteSQL, [mobileNumber], (err, result) => {
//         if (err) {
//           return reject(err);
//         }
//         resolve(result);
//       });
//     });

//     return res.status(200).json({ status: true, message: "Login Successful" });
//   } catch (error) {
//     console.log(error);
//     return res
//       .status(500)
//       .json({ status: false, message: "Error validating OTP" });
//   }
// };

exports.verifyOtp = async (req, res) => {
  console.log("hii");
  console.log(req.body);
  const { mobileNumber, otp } = req.body;

  try {
    const sql = `SELECT 
          customers.name, 
          customers.mobile, 
          customers.email, 
          customers.password, 
          customers.role,
          login_otp.otp, 
          login_otp.expiresAt
      FROM 
          customers
      JOIN 
          login_otp 
      ON 
          customers.mobile = login_otp.mobile
      WHERE 
          login_otp.mobile = ?`;

    const result = await new Promise((resolve, reject) => {
      db.query(sql, [mobileNumber], (err, result) => {
        if (err) {
          return reject(err);
        }
        resolve(result);
      });
    });

    if (result.length === 0) {
      return res.status(404).json({ status: false, message: "OTP not found" });
    }

    const userRecord = result[0];
    console.log(userRecord);
    const currentDate = new Date(Date.now())
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    if (new Date(userRecord.expiresAt) < currentDate) {
      return res.status(400).json({ status: false, message: "OTP expired" });
    }

    if (userRecord.otp !== otp) {
      return res.status(400).json({ status: false, message: "Invalid OTP" });
    }

    const token = jwt.sign(
      {
        userName: userRecord.name,
        email: userRecord.email,
        mobile: userRecord.mobile,
        role: userRecord.role,
      },
      SECRET_KEY,
      {
        expiresIn: "1h",
      }
    );

    // Send token to the frontend instead of setting it in a cookie
    return res.status(200).json({ 
      status: true, 
      message: "Login Successful", 
      token,
      user: {
        userName: userRecord.name,
        email: userRecord.email,
        mobile: userRecord.mobile,
        role: userRecord.role
      }
    });

    // Clean up OTP after successful login
    const deleteSQL = `DELETE FROM login_otp WHERE mobile = ?`;
    const deleteResult = await new Promise((resolve, reject) => {
      db.query(deleteSQL, [mobileNumber], (err, result) => {
        if (err) {
          return reject(err);
        }
        resolve(result);
      });
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: "Error validating OTP" });
  }
};


exports.logoutCustomer = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: false,
  });

  return res
    .status(200)
    .json({ status: true, message: "Logged out successfully" });
};

const sendWhatsAppOrderData = async (userData) => {
  console.log(userData);
  const { mobile, name, orderId, items, totalAmount, orderStatus } = userData;

  const orderItems = items.map(
    (item) =>
      `${item.name} - ${item.weight}, ${item.quantity} quantity, ${item.price}`
  );

  const data = {
    apiKey: process.env.AISENSY_KEY,
    campaignName: "",
    destination: mobile, // Recipient's phone number
    userName: name, // Your username or identifier
    templateParams: [name, orderId, orderItems, totalAmount, orderStatus], // Array of template parameters
  };

  try {
    const response = await axios.post(
      "https://backend.aisensy.com/campaign/t1/api/v2",
      data,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log("Message sent successfully:", response.data);
  } catch (error) {
    console.error(
      "Error sending message:",
      error.response ? error.response.data : error.message
    );
  }
};

exports.createOrder = async (req, res) => {
  console.log("body in create order Route");
  console.log(req.body);
  console.log("user in create order Route");
  console.log(req.user);
  const { name, mobile,address,orderItems, totalPrice } = req.body;

  const options = {
    amount: totalPrice * 100, // Razorpay expects amount in paise
    currency: "INR",
    receipt: `receipt_${Date.now()}`, // Unique receipt ID
  };
  try {
    const order = await razorpay.orders.create(options);
    if (!order)
      return res
        .status(500)
        .json({ status: false, message: "Error in Creating Payment" });

    const currentDate = new Date(Date.now())
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");
    const sql = `
  INSERT INTO customer_orders 
  (transaction_id, name, mobile,address, order_items, total_price, created_at, payment_status, delivery_status) 
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    const result = await new Promise((resolve, reject) => {
      db.query(
        sql,
        [
          order.id,
          name,
          mobile,
          address,
          JSON.stringify(orderItems), // Convert orderItems to JSON string
          totalPrice,
          currentDate,
          "pending",
          "processing", // Make sure this value matches the expected data type
        ],
        (err, result) => {
          if (err) {
            return reject(err);
          }
          resolve(result);
        }
      );
    });
    return res.status(201).json(order);
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, message: "Error placing order" });
  }
};

const renderTemplate = (view, data) => {
  return new Promise((resolve, reject) => {
    app.render(view, data, (err, html) => {
      if (err) return reject(err);
      resolve(html);
    });
  });
};

exports.verifyOrder = async (req, res) => {
  const { orderId, paymentId, razorpayOrderId, razorpaySignature } = req.body;
  console.log("body in verify order route");
  console.log(req.body);
  console.log("user in verify route");
  const user = req.user;
  //   SEND ADDRESS AND OTHER DATA FROM HANDLER
  // const user = {
  //   userName: "muhil",
  //   email: "muhil@gmail.com",
  //   mobile: "9342407556",
  //   role: "customer",
  //   iat: 1725529136,
  //   exp: 1725532736,
  // };
  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${paymentId}`)
    .digest("hex");

  if (generatedSignature === razorpaySignature) {
    try {
      // const updateSQL =
      //   "UPDATE customer_orders SET payment_status = ? where transaction_id =?";
      // const updateResult = await new Promise((resolve, reject) => {
      //   db.query(updateSQL, ["paid", orderId], (err, result) => {
      //     if (err) {
      //       return reject(err);
      //     }
      //     resolve(result);
      //   });
      // });
      // res.json({ status: true, message: "Payment Successfull" });
      const orderDetails = {
        orderId: orderId,
        orderDate: new Date().toLocaleString(), // Set the order date
        paymentMethod: "Online",
        customerName: user.userName,
        customerAddress: "Your Address Here", // Replace with actual customer address
        customerMobile: user.mobile,
        customerEmail: user.email,
        orderItems: orderItems,
        itemTotal: 507.0, // Replace with actual item total
        deliveryCharge: 100.0, // Replace with actual delivery charge
        totalAmount: 607.0, // Replace with actual total amount
      };

      // Make a request to generate the PDF and send the email
      await axios.post(
        "http://localhost:8000/generate-pdf-and-send",
        orderDetails
      );

      // Send a success response to the client
      res.json({ status: true, message: "Payment Successful and email sent" });
    } catch (error) {
      res.status(500).json({ status: false, error: "Database update failed" });
    }
  } else {
    res.status(400).json({ status: false, error: "Invalid Payment signature" });
  }
};

exports.webhook = async (req, res) => {
  const secret = "YOUR_WEBHOOK_SECRET";
  // Verify the webhook signature
  const shasum = crypto.createHmac("sha256", secret);
  shasum.update(JSON.stringify(req.body));
  const digest = shasum.digest("hex");

  if (digest === req.headers["x-razorpay-signature"]) {
    // Handle the event based on its type
    const event = req.body.event;
    const paymentEntity = req.body.payload.payment.entity;

    if (event === "payment.captured") {
      const orderId = paymentEntity.order_id;
      try {
        const updateSQL =
          "UPDATE customer_orders SET payment_status = ? where transaction_id =?";
        const updateResult = await new Promise((resolve, reject) => {
          db.query(updateSQL, ["paid", orderId], (err, result) => {
            if (err) {
              return reject(err);
            }
            resolve(result);
          });
        });

        if (updateResult.affectedRows > 0) {
          const SQL = "SELECT * from customer_orders  where transaction_id =?";
          const result = await new Promise((resolve, reject) => {
            db.query(SQL, [orderId], (err, result) => {
              if (err) {
                return reject(err);
              }
              resolve(result);
            });
          });
          const orderData = result[0];
          sendWhatsAppOrderData(orderData);

          return res
            .status(200)
            .json({ status: true, message: "Payment updated to paid" });
        }
      } catch (err) {
        console.error("Failed to update order status:", err);
        res
          .status(500)
          .json({ status: false, message: "Database update failed" });
      }
    } else {
      res.status(400).json({ status: false, message: "event not handled" });
    }
  } else {
    res.status(400).json({ status: false, message: "invalid signature" });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const { mobile } = req.user;
    const sql = "SELECT * FROM customer_orders WHERE mobile = ? LIMIT 4";
    const result = await new Promise((resolve, reject) => {
      db.query(sql, [mobile], (err, result) => {
        if (err) {
          return reject(err);
        }
        resolve(result);
      });
    });
    return res.status(200).json({ status: true, result: result });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, message: "Error fetching orders" });
  }
};
