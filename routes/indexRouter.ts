import express from "express";
import indexController from "../controllers/indexController";
import passport from "passport";
const router = express.Router();

router.get("/", indexController.indexGet);
router.get("/signup", indexController.signupGet);
router.post("/signup", indexController.signupPost);
router.get("/login", indexController.loginGet);
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
  }),
);
router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect("/");
  });
});
router.get("/membership", indexController.membershipGet);
router.post("/membership", indexController.membershipPost);
router.get("/welcome-new-member", indexController.welcomeNewMemberGet);

export default router;
