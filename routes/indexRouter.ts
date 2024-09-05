import express from "express";
import indexController from "../controllers/indexController";
const router = express.Router();

router.get("/", indexController.indexGet);
router.get("/signup", indexController.signupGet);

export default router;
