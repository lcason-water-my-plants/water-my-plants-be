const express = require("express");
const exampleController = require("../controllers/exampleController");
const authController = require("../controllers/authController");

const router = express.Router();

router
  .route("/top-5-cheap")
  .get(exampleController.aliasTopExamples, exampleController.getAllExamples);

router.route("/example-stats").get(exampleController.getExampleStats);
router.route("/monthly-plan/:year").get(exampleController.getMonthlyPlan);

router
  .route("/")
  .get(authController.protect, exampleController.getAllExamples)
  .post(exampleController.createExample);

router
  .route("/:id")
  .get(exampleController.getExample)
  .patch(exampleController.updateExample)
  .delete(
    authController.protect,
    authController.restrictTo("admin"),
    exampleController.deleteExample
  );

module.exports = router;
