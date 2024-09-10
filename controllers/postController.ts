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
    res.render("postFormCreate", { title: "What's your story?" });
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
      res.status(400).render("postFormCreate", {
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

// /posts/:postId/update
export const postUpdateGet = [
  isLoggedIn,
  param("postId").isInt(),
  asyncHandler(async (req, res, next) => {
    const valResult = validationResult(req);
    if (!valResult.isEmpty()) {
      const err = new HttpError("Resource didn't pass validation", 400);
      next(err);
      return;
    }

    const data = matchedData(req);
    const postId = parseInt(data.postId);
    // get post
    const post = await Posts.getPostById(postId, true);

    if (!post) {
      const error = new HttpError("Post doesn't exist", 404);
      next(error);
      return;
    }
    // verify current user is either admin or the post author
    const canSeePage = req.user?.is_admin || req.user?.id === post?.author_id;

    if (canSeePage) {
      // if admin or post author, show the page
      res.render("postForm", {
        title: "Update you story.",
        post: {
          id: post.id,
          title: he.decode(post.title),
          body: he.decode(post.body),
        },
      });
      return;
    } else {
      // if not admin or post author, send error page.
      const error = new HttpError("You are not authorized", 403);
      next(error);
      return;
    }
  }),
];

// POST /posts/:postId/update
export const postUpdatePost = [
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
  param("postId").isInt(),
  asyncHandler(async (req, res, next) => {
    const valResult = validationResult(req);
    const data = matchedData(req);
    let postId: number;
    if (!valResult.isEmpty()) {
      const validErrors = valResult.mapped();
      if (validErrors?.postId) {
        const error = new HttpError("postId is invalid", 400);
        next(error);
        return;
      }

      postId = parseInt(data.postId);
      const post = await Posts.getPostById(postId, true);
      if (!post) {
        const error = new HttpError("Post doest not exist.", 404);
        next(error);
        return;
      }
      const canEdit = req.user?.is_admin || req.user?.id === post?.author_id;
      if (!canEdit) {
        const error = new HttpError(
          "You are not authorized to edit this post",
          403,
        );
        next(error);
        return;
      }
      res.render("postForm", {
        title: "Update Your Story!",
        post: {
          id: post.id,
          title: he.decode(data.title),
          body: he.decode(data.body),
        },
      });
      return;
    }
    // all validation passes.
    postId = parseInt(data.postId);
    const post = await Posts.getPostById(postId, true);
    if (!post) {
      const error = new HttpError("Post does not exist", 404);
      next(error);
      return;
    }
    const canEdit = req.user?.is_admin || req.user?.id === post?.author_id;
    if (!canEdit) {
      const error = new HttpError(
        "You are not authorized to edit this post",
        403,
      );
      next(error);
      return;
    }
    await Posts.updatePostById(post.id, { title: data.title, body: data.body });
    res.redirect(`/posts/${post.id}`);
  }),
];

// GET /posts/:postId/delete
export const deletePostGet = [
  isLoggedIn,
  param("postId").isInt(),
  asyncHandler(async (req, res, next) => {
    const valResult = validationResult(req);
    const data = matchedData(req);
    if (!valResult.isEmpty()) {
      const error = new HttpError("postId is not valid", 400);
      next(error);
      return;
    }
    const postId = parseInt(data.postId);
    const post = await Posts.getPostById(postId, true);
    if (!post) {
      next(new HttpError("Post does not exist", 404));
      return;
    }
    const canDelete = req.user?.is_admin || req.user?.id === post.author_id;
    if (!canDelete) {
      next(new HttpError("You are not authorized to delete this post", 403));
      return;
    }
    res.render("postDelete", {
      title: "Are You Sure You Want To Delete This Post?",
      post: {
        id: post.id,
        author_name: he.decode(post.author_name),
        title: he.decode(post.title),
        body: he.decode(post.body),
        created_at: DateTime.fromJSDate(post.created_at).toLocaleString(
          DateTime.DATETIME_MED,
        ),
        updated_at: DateTime.fromJSDate(post.updated_at).toLocaleString(
          DateTime.DATETIME_MED,
        ),
      },
    });
  }),
];
// POST /posts/:postId/delete
export const deletePostPost = [
  isLoggedIn,
  body("postId").isInt(),
  asyncHandler(async (req, res, next) => {
    const valResult = validationResult(req);
    const data = matchedData(req);
    if (!valResult.isEmpty()) {
      const error = new HttpError("postId is not valid", 400);
      next(error);
      return;
    }
    const postId = parseInt(data.postId);

    const post = await Posts.getPostById(postId, true);
    if (!post) {
      next(new HttpError("Post Doesn't exist", 400));
      return;
    }
    const canDelete = req.user?.is_admin || req.user?.id === post.author_id;
    if (!canDelete) {
      next(new HttpError("You are not authorized", 403));
      return;
    }
    await Posts.deletePostById(post.id);
    res.redirect("/");
  }),
];
