import asyncHandler from "express-async-handler";
import HttpError from "../lib/HttpError";
import { query, validationResult, matchedData } from "express-validator";
import Posts from "../models/posts";
import { DateTime } from "luxon";

const indexGet = [
  query("page").optional().isInt(),
  asyncHandler(async (req, res, next) => {
    const valResult = validationResult(req);
    if (!valResult.isEmpty()) {
      const error = new HttpError("validation error in page query param", 400);
      next(error);
      return;
    }
    const data = matchedData(req);
    let page = parseInt(data.page || "1");
    const limit = 5;
    const totalCount = await Posts.getPostsCount();
    const totalPages = Math.ceil(totalCount / limit);
    if (page > totalPages) page = totalPages;
    if (page <= 0) page = 1;

    const posts = await Posts.getPosts(false, page, limit);
    const displayPosts = posts.map((post) => {
      return {
        ...post,
        created_at: DateTime.fromJSDate(post.created_at).toLocaleString(
          DateTime.DATETIME_MED,
        ),
        updated_at: DateTime.fromJSDate(post.updated_at).toLocaleString(
          DateTime.DATETIME_MED,
        ),
      };
    });
    const pagesArr: number[] = [];
    for (let i = 1; i <= totalPages; i++) {
      pagesArr.push(i);
    }
    res.render("index", {
      title: "Members Only Club",
      posts: displayPosts,
      pagesArr: pagesArr,
      currentPage: page,
    });
  }),
];

const signupGet = [
  asyncHandler(async (req, res, next) => {
    res.render("signup", { title: "Sign Up To Our VIP Message Board" });
  }),
];

export default {
  indexGet,
  signupGet,
};
