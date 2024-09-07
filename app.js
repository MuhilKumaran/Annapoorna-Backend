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
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use("/menus", menuRoutes);

app.use("/customers", customerRoutes);
app.use("/admin", adminRoutes);

const renderTemplate = (view, data) => {
  return new Promise((resolve, reject) => {
    app.render(view, data, (err, html) => {
      if (err) return reject(err);
      resolve(html);
    });
  });
};

// POST route to create, send PDF and send it as email attachment
app.post("/generate-pdf-and-send", async (req, res) => {
  const {
    orderId,
    orderDate,
    paymentMethod,
    customerName,
    customerAddress,
    customerMobile,
    customerEmail,
    orderItems,
    itemTotal,
    deliveryCharge,
    totalAmount,
  } = req.body;

  // Bill data to be passed to the template

  const billData = {
    orderId,
    orderDate,
    paymentMethod,
    customerName,
    customerAddress,
    customerMobile,
    customerEmail,
    orderItems,
    itemTotal,
    deliveryCharge,
    totalAmount,
  };

  try {
    // Render the HTML using EJS with the passed data
    const html = await renderTemplate("bill", billData);

    // Launch Puppeteer to generate the PDF
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Set the content of the page to the rendered HTML
    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    // Generate the PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    // Close the browser
    await browser.close();

    // Send email with the PDF attachment
    const transporter = nodemailer.createTransport({
      service: "gmail", // or another SMTP service
      auth: {
        user: "your-email@gmail.com", // your email
        pass: "your-email-password", // your email password or app-specific password
      },
    });

    const mailOptions = {
      from: "your-email@gmail.com",
      to: customerEmail,
      subject: `Invoice - Order ${orderId}`,
      text: `Dear ${customerName},\n\nPlease find attached the invoice for your recent purchase.\n\nThank you for shopping with us!`,
      attachments: [
        {
          filename: `invoice-${orderId}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).send("Failed to send email");
      } else {
        console.log("Email sent:", info.response);
        res.send("PDF generated and email sent successfully");
      }
    });
  } catch (err) {
    console.error("Error generating PDF or sending email:", err);
    res.status(500).send("Failed to generate PDF and send email");
  }
});

module.exports = app;
