import express from "express";
import * as postController from "../controllers/postController";

const router = express.Router();

// all of these routes are prefixed by /posts
router.get("/create", postController.createPostGet);
router.post("/create", postController.createPostPost);
router.get("/:postId", postController.postViewGet);

export default router;
