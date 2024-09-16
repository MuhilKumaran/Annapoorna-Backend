require("dotenv").config({ path: "../config.env" });
const db = require("../Modules/mysql");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.SECRET_KEY;
const Razorpay = require("razorpay");
const pdf = require("html-pdf");
const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path");
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
      from: "+15085072466",
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
    // Send token to the frontend instead of setting it in a cookie
    return res.status(200).json({
      status: true,
      message: "Login Successful",
      token,
      user: {
        userName: userRecord.name,
        email: userRecord.email,
        mobile: userRecord.mobile,
        role: userRecord.role,
      },
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, message: "Error validating OTP" });
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

// const sendWhatsAppOrderData = async (userData) => {
//   console.log(userData);
//   const {
//     mobile,
//     userName,
//     orderId,
//     items,
//     totalAmount,
//     paymentStatus,
//     deliveryStatus,
//   } = userData;

//   const orderItems = items.map(
//     (item) =>
//       `${item.name} - ${item.weight}, ${item.quantity} quantity, ${item.price} \n`
//   );

//   const data = {
//     apiKey: process.env.AISENSY_KEY,
//     campaignName: "Order_Data",
//     destination: mobile, // Recipient's phone number
//     userName: userName, // Your username or identifier
//     templateParams: [
//       userName,
//       orderItems,
//       totalAmount,
//       paymentStatus,
//       deliveryStatus,
//     ], // Array of template parameters
//   };

//   try {
//     const response = await axios.post(
//       "https://backend.aisensy.com/campaign/t1/api/v2",
//       data,
//       {
//         headers: {
//           "Content-Type": "application/json",
//         },
//       }
//     );
//     console.log("Message sent successfully:", response.data);
//   } catch (error) {
//     console.error(
//       "Error sending message:",
//       error.response ? error.response.data : error.message
//     );
//   }
// };

// const sendWhatsAppOrderData = async (userData) => {
//   console.log(userData);
//   const {
//     mobile,
//     userName,
//     orderId,
//     items,
//     totalAmount,
//     paymentStatus,
//     deliveryStatus,
//   } = userData;

//   // Convert order items array to a string, listing each item on a new line
//   const orderItems = items
//     .map(
//       (item) =>
//         `${item.name} - ${item.weight}, ${item.quantity} quantity, ₹${item.price}`
//     )
//     .join("\n"); // Join items into a single string with line breaks

//   const data = {
//     apiKey: process.env.AISENSY_KEY,
//     campaignName: "Order_Data",
//     destination: String(mobile), // Ensure mobile is a string
//     userName: String(userName),  // Ensure userName is a string
//     templateParams: [
//       String(userName),
//       orderItems, // Ensure the items are properly formatted as a single string
//       String(totalAmount),
//       String(paymentStatus),
//       String(deliveryStatus),
//     ], // Array of template parameters must all be strings
//   };

//   try {
//     const response = await axios.post(
//       "https://backend.aisensy.com/campaign/t1/api/v2",
//       data,
//       {
//         headers: {
//           "Content-Type": "application/json",
//         },
//       }
//     );
//     console.log("Message sent successfully:", response.data);
//   } catch (error) {
//     console.error(
//       "Error sending message:",
//       error.response ? error.response.data : error.message
//     );
//   }
// };

const sendWhatsAppOrderData = async (userData) => {
  console.log(userData);
  const {
    mobile,
    userName,
    orderId,
    items,
    totalAmount,
    paymentStatus,
    deliveryStatus,
  } = userData;

  const orderItems = items
    .map(
      (item) =>
        `${item.name} - ${item.weight}, ${item.quantity} quantity, ₹ ${item.price}`
    )
    .join("");

  const data = {
    apiKey: process.env.AISENSY_KEY,
    campaignName: "Order_Data",
    destination: String(mobile), // Ensure mobile is a string
    userName: String(userName), // Ensure userName is a string
    templateParams: [
      String(userName),
      orderItems, // Ensure the items are properly formatted as a single string
      String(totalAmount),
      String(paymentStatus),
      String(deliveryStatus),
    ], // Array of template parameters must all be strings
    media: {
      url: "https://aisensy-project-media-library-stg.s3.ap-south-1.amazonaws.com/IMAGE/5f450b00f71d36faa1d02bc4/9884334_graffiti%20dsdjpg",
      filename: "demo-file",
    },
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
  const { name, mobile, address, orderItems, totalPrice } = req.body;

  const options = {
    amount: totalPrice * 100,
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
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
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

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
    ejs.renderFile(
      path.join(__dirname, "views", `${view}.ejs`),
      data,
      (err, html) => {
        if (err) return reject(err);
        resolve(html);
      }
    );
  });
};

// const{ mobile, name, orderId, items, totalAmount, orderStatus}

exports.verifyOrder = async (req, res) => {
  const {
    orderId,
    paymentId,
    razorpayOrderId,
    razorpaySignature,
    orderItems,
    totalAmount,
  } = req.body;
  console.log("body in verify order route");
  console.log(req.body);
  console.log("user in verify route");
  const user = req.user;
  console.log(user);
  console.log(orderItems);

  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${paymentId}`)
    .digest("hex");

  if (generatedSignature === razorpaySignature) {
    try {
      console.log("hash verified");
      console.log(user);
      const updateSQL =
        "UPDATE customer_orders SET payment_status = ? WHERE transaction_id = ?";
      await new Promise((resolve, reject) => {
        db.query(updateSQL, ["paid", orderId], (err, result) => {
          if (err) {
            return reject(err);
          }
          resolve(result);
        });
      });
      const userData = {
        mobile: user.mobile,
        userName: user.userName,
        orderId: "TEST123",
        items: orderItems,
        totalAmount: totalAmount,
        paymentStatus: "paid",
        deliveryStatus: "Order in Processing",
      };
      console.log("Before sending Aisensys");
      console.log(userData.userName);
      // sendWhatsAppOrderData(userData);

      const deliveryCharge = 100.0; // Replace with actual delivery charge

      const billData = {
        orderId: orderId,
        orderDate: new Date().toLocaleString(),
        paymentMethod: "Online",
        customerName: user.userName,
        customerAddress: "Your Address Here",
        customerMobile: user.mobile,
        customerEmail: user.email,
        orderItems: orderItems,
        itemTotal: totalAmount,
        deliveryCharge: deliveryCharge,
        totalAmount: Number(totalAmount) + deliveryCharge,
      };
      console.log();
      // Render the HTML using EJS with the passed data
      const html = await renderTemplate("bill", billData);

      // Generate the PDF using html-pdf
      const pdfBuffer = await new Promise((resolve, reject) => {
        pdf
          .create(html, { format: "A4", border: "10mm" })
          .toBuffer((err, buffer) => {
            if (err) return reject(err);
            resolve(buffer);
          });
      });

      // Send email with the PDF attachment
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "muhilkumaran@gmail.com",
          pass: "lkmvwumfkxzfblxe",
        },
      });

      const mailOptions = {
        from: "muhilkumaran@gmail.com",
        to: user.email,
        subject: `Invoice - Order ${orderId}`,
        text: `Dear ${user.userName},\n\nPlease find attached the invoice for your recent purchase.\n\nThank you for shopping with us!`,
        attachments: [
          {
            filename: `invoice-${orderId}.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      };

      await new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) return reject(error);
          resolve(info);
        });
      });

      // Send a success response to the client
      res
        .status(200)
        .json({ status: true, message: "Payment Successful and email sent" });
    } catch (error) {
      console.error("Error processing order:", error);
      res.status(500).json({ status: false, error: "Failed to process order" });
    }
  } else {
    res.status(400).json({ status: false, error: "Invalid Payment signature" });
  }
};

exports.sendContactUs = async (req, res) => {
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
            <h2>FEEDBACK</h2>
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
      subject: "Someone Tried To Contact You",
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
      .json({ status: true, message: "Email Sent Successfully" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, message: "Failed to Send Email" });
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
// http://localhost:3000/get-orders?mobileNumber=1234567890
exports.getOrders = async (req, res) => {
  try {
    const { mobileNumber } = req.query;
    console.log("In get order");
    console.log(req.query);
    console.log(mobileNumber);
    if (!mobileNumber)
      return res.status(400).json({
        status: false,
        message: "mobileNumber is required to Fetch orders",
      });
    const sql = "SELECT * FROM customer_orders WHERE mobile = ? LIMIT 4";
    const result = await new Promise((resolve, reject) => {
      db.query(sql, [mobileNumber], (err, result) => {
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
