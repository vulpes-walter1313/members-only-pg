import { type Request, type Response, type NextFunction } from "express";
import { body, matchedData, validationResult } from "express-validator";
import asyncHandler from "express-async-handler";
import { isLoggedIn } from "../middleware/authcheck";
import * as Posts from "../models/posts";

export const createPostGet = [
  isLoggedIn,
  (req: Request, res: Response, next: NextFunction) => {
    res.render("postForm", { title: "What's your story?" });
  },
];
export const createPostPost = [
  isLoggedIn,
  body("title")
    .trim()
    .isLength({ min: 1, max: 256 })
    .withMessage("Title must be between 1 and 256 characters")
    .escape(),
  body("body")
    .trim()
    .isLength({ min: 1, max: 2048 })
    .withMessage("Story must be between 1 and 2048 characters")
    .escape(),
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const valResult = validationResult(req);
    if (!valResult.isEmpty()) {
      res
        .status(400)
        .render("postForm", {
          title: "What's Your Story?",
          validErrors: valResult.mapped(),
        });
      return;
    }
    const data = matchedData(req);
    const title = data.title as string;
    const body = data.body as string;

    // create a post
    const newPostId = await Posts.createPost({
      author_id: req.user?.id!,
      title: title,
      body: body,
    });
    res.redirect(`/posts/${newPostId}`);
  }),
];
