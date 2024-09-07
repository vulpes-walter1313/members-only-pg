import { type Request, type Response, type NextFunction } from "express";
import { body, matchedData, param, validationResult } from "express-validator";
import asyncHandler from "express-async-handler";
import { isLoggedIn } from "../middleware/authcheck";
import * as Posts from "../models/posts";
import HttpError from "../lib/HttpError";
import he from "he";
import { DateTime } from "luxon";

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
      res.status(400).render("postForm", {
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

// /posts/:postId
export const postViewGet = [
  param("postId").isInt(),
  asyncHandler(async (req, res, next) => {
    const valResult = validationResult(req);
    if (!valResult.isEmpty()) {
      const error = new HttpError("that is not a valid resource", 400);
      next(error);
      return;
    }
    const data = matchedData(req);
    const postId = parseInt(data.postId);
    const canViewAllData =
      req.user !== undefined && req.user.is_member === true;

    const post = await Posts.getPostById(postId, canViewAllData);
    if (post) {
      const displayPost = {
        ...post,
        title: he.decode(post.title),
        body: he.decode(post.body),
        created_at: DateTime.fromJSDate(post.created_at).toLocaleString(
          DateTime.DATETIME_MED,
        ),
        updated_at: DateTime.fromJSDate(post.updated_at).toLocaleString(
          DateTime.DATETIME_MED,
        ),
      };
      const canEdit =
        req.user !== undefined &&
        (req.user.is_admin || req.user.id === post.author_id);
      res.render("postView", { post: displayPost, canEdit: canEdit });
      return;
    } else {
      const error = new HttpError("Post doesn't Exist", 404);
      next(error);
      return;
    }
  }),
];
