import express from "express";
import * as indexController from "../controllers/indexController";
const router = express.Router();

router.get("/", indexController.indexGet);
router.get("/signup", indexController.signupGet);
router.post("/signup", indexController.signupPost);
router.get("/login", indexController.loginGet);
router.post("/login", indexController.loginPost);
router.get("/logout", indexController.logoutGet);
router.get("/membership", indexController.membershipGet);
router.post("/membership", indexController.membershipPost);
router.get("/welcome-new-member", indexController.welcomeNewMemberGet);
router.get("/become-an-admin", indexController.becomeAdminGet);
router.post("/become-an-admin", indexController.becomeAdminPost);
router.get("/welcome-new-admin", indexController.welcomeNewAdminGet);

export default router;
