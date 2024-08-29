const express = require("express");
const router = express.Router();
const customerController = require("../Controllers/customerController");
const authenticateCustomer = require('../Modules/auth');

router
    .route("/signup")
    .post(customerController.signupCustomer);

router
    .route("/send-otp")
    .post(customerController.sendOTP);

router
    .route("/verify-otp")
    .post(customerController.verifyOtp);

router
    .route("/logout")
    .post(authenticateCustomer,customerController.logoutCustomer);

router
    .route("/create-order")
    .post(authenticateCustomer,customerController.createOrder) 
    .get(authenticateCustomer,customerController.getOrders)

router
    .route("/verify-order")
    .post(authenticateCustomer,customerController.verifyOrder);

router
    .route("/webhook")
    .post(customerController.webhook);
  
module.exports=router;
