const express = require("express");
const plantController = require("../controllers/plantController");
const authController = require("../controllers/authController");

const router = express.Router();

router
  .route("/")
  .get(authController.protect, plantController.getAllPlants)
  .post(plantController.createPlant);

router
  .route("/:id")
  .get(plantController.getPlant)
  .patch(plantController.updatePlant)
  .post(authController.protect, plantController.createPlant)
  .delete(
    authController.protect,
    authController.restrictTo("admin"),
    plantController.deletePlant
  );

module.exports = router;
