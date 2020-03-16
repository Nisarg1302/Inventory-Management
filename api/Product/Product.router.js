const router = require("express").Router();
const passport = require("passport");
const { CreateProduct, getProducts } = require("./Product.controller");

router.post(
  "/createproduct",
  passport.authenticate("jwt", { session: false }),
  CreateProduct
);
router.get(
  "/getproducts",
  passport.authenticate("jwt", { session: false }),
  getProducts
);

module.exports = router;