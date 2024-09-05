const express = require("express");
const router = express.Router();
const adminController = require("../Controllers/adminController");

// router.route("/signup").post(adminController.signUpAdmin);
router.route("/login").post(adminController.loginAdmin);
router.route("/logout").post(adminController.logoutAdmin);
router
    .route("/updateMenu")
    .put(adminController.updateMenu);
router

  .route("/manageOrder")
  .patch(adminController.manageOrder)
  .get(adminController.getOrdersByDeliveryStatus);

module.exports = router;
