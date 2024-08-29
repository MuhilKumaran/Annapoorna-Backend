const db = require("../Modules/mysql");
const bcrypt = require("bcrypt");

// exports.signUpAdmin = async (req, res, next) => {
//   try {
//     const { name, email, phone, password } = req.body;

//     const hashPassword = await bcrypt.hash(password, 10);

//     const sql =
//       "INSERT INTO admins (email,name,phone,password) VALUES (?,?,?,?)";
//     const result = await new Promise((resolve, reject) => {
//       db.query(sql, [email, name, phone, hashPassword], (err, result) => {
//         if (err) {
//           return reject(err);
//         }
//         resolve(result);
//       });
//     });

//     return res.status(201).json({
//       status: "success",
//       type: "Sign Up",
//       message: "Sign Up Successful",
//     });
//   } catch (error) {
//     return res
//       .status(500)
//       .json({ message: "Error inserting customer details" });
//   }
// };

exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Promise-based query execution
    const sql = "SELECT email,password FROM admins WHERE email = ?";
    const result = await new Promise((resolve, reject) => {
      db.query(sql, [email], (err, result) => {
        if (err) {
          return reject(err);
        }
        resolve(result);
      });
    });

    if (result.length === 0) {
      return res
        .status(404)
        .json({ status: "fail", message: "User not found" });
    }
    const adminData = result[0];
    const match = await bcrypt.compare(password, adminData.password);
    if (!match) {
      return res
        .status(400)
        .json({ status: "fail", message: "Invalid Password" });
    }

    return res
      .status(200)
      .json({ status: "success", message: "Login Successful" });
  } catch (error) {
    return res
      .status(500)
      .json({ status: "fail", message: "Error in Finding User" });
  }
};

exports.logoutAdmin = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: false,
  });
};

exports.updateMenu = async (req, res) => {
  try {
    const { product_name, shelf_life } = req.body;
    // SQL query to update the shelf_life of the menu item
    const sql =
      "UPDATE menu_items SET product_info = JSON_SET(product_info, '$.shelf_life', ?) WHERE product_name = ?";

    const result = await new Promise((resolve, reject) => {
      db.query(sql, [shelf_life, product_name], (err, result) => {
        if (err) {
          return reject(err);
        }
        resolve(result);
      });
    });

    if (result.affectedRows > 0) {
      return res
        .status(200)
        .json({ status: true, message: "Shelf life updated successfully" });
    } else {
      return res
        .status(404)
        .json({ status: false, message: "Menu item not found" });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: "Error in updating menu item" });
  }
};
const sendDeliveryStatus = async (userData) => {
  const { mobile, name, orderId, items, totalAmount, deliveryStatus } =
    userData;

  const orderItems = items.map(
    (item) =>
      `${item.name} - ${item.weight}, ${item.quantity} quantity, ${item.price}`
  );

  const data = {
    apiKey: process.env.AISENSY_KEY,
    campaignName: "Order_Details",
    destination: mobile, // Recipient's phone number
    userName: name, // Your username or identifier
    templateParams: [name, orderId, orderItems, totalAmount, deliveryStatus], // Array of template parameters
    media: {
      url: "https://aisensy-project-media-library-stg.s3.ap-south-1.amazonaws.com/IMAGE/5f450b00f71d36faa1d02bc4/9884334_graffiti%20dsdjpg",
      filename: "Banner - File",
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

exports.manageOrder = async (req, res) => {
  try {
    const { order_id, delivery_status } = req.body;
    if (!order_id || !delivery_status) {
      return res.status(400).json({
        status: false,
        error: "Order ID and order status are required",
      });
    }
    const sql =
      "UPDATE customer_orders SET delivery_status = ? WHERE order_id = ?";
    const result = await new Promise((resolve, reject) => {
      db.query(sql, [delivery_status, order_id], (err, result) => {
        if (err) {
          return reject(err);
        }
        resolve(result);
      });
    });
    if (result.affectedRows > 0) {
      const SQL = "SELECT * from customer_orders  where order_id =?";
      const result = await new Promise((resolve, reject) => {
        db.query(SQL, [order_id], (err, result) => {
          if (err) {
            return reject(err);
          }
          resolve(result);
        });
      });
      orderData = result[0];
      sendDeliveryStatus(orderData);
      return res
        .status(200)
        .json({ status: true, message: "Order status updated successfully" });
    } else {
      return res
        .status(404)
        .json({ status: false, message: "Order not found" });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: "Error in updating order status" });
  }
};

exports.getOrdersByDeliveryStatus = async (req, res) => {
  const { deliveryStatus } = req.body;
  try {
    const SQL = "SELECT * from customer_orders WHERE delivery_status = ?";
    const result = await new Promise((resolve, reject) => {
      db.query(SQL, deliveryStatus, (err, result) => {
        if (err) {
          return reject(err);
        }
        resolve(result);
      });
    });
    return res
      .status(200)
      .json({ status: true, mesasage: "Order Retrived Successfully", result });
  } catch (error) {
    return res
      .status(500)
      .json({ status: false, message: "Getting orders Failed" });
  }
};
