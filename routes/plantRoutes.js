const express = require("express");
const plantController = require("../controllers/plantController");
const authController = require("../controllers/authController");

const router = express.Router();

//#TODO
//get plants by id to display all plants
//get by id and update for plant protected
//get plants by user with days of week
//get all plants by user ID protected
//update active status protected

// router
//   .route("/top-5-cheap")
//   .get(plantController.aliasTopPlants, plantController.getAllPlants);

// router.route("/plant-stats").get(plantController.getPlantStats);
// router.route("/monthly-plan/:year").get(plantController.getMonthlyPlan);

router
  .route("/")
  .get(authController.protect, plantController.getAllPlants) //This needs to be per user
  .post(plantController.createPlant);

router
  .route("/:id")
  .get(plantController.getPlant) //#TODO get plant by plant ID
  .patch(plantController.updatePlant) //#TODO UPDATE plant schedule, summary and picture
  .post(authController.protect, plantController.createPlant)
  .delete(
    authController.protect,
    authController.restrictTo("admin"),
    plantController.deletePlant
  );

module.exports = router;
