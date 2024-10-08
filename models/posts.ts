import db from "../db/pool";

type PostObject = {
  id: number;
  author_id: string;
  author_name: string;
  title: string;
  body: string;
  created_at: Date;
  updated_at: Date;
};
export async function getPosts(
  isAnonymous: boolean,
  page: number,
  limit: number,
) {
  const offset = (page <= 0 ? 1 : page - 1) * limit;

  if (isAnonymous) {
    const { rows } = await db.query(
      `SELECT 
      posts.id,
      author_id,
      'Anonymous' AS author_name,
      title,
      CASE
        WHEN LENGTH(body) > 256
        THEN CONCAT(LEFT(body, 256), '...')
        ELSE body
      END AS body,
      created_at,
      updated_at
    FROM posts
    JOIN users ON posts.author_id = users.id
    ORDER BY updated_at DESC
    OFFSET $1
    FETCH FIRST $2 ROWS ONLY`,
      [offset, limit],
    );
    // console.log("models/posts.ts", rows);
    return rows as PostObject[];
  } else {
    const { rows } = await db.query(
      `SELECT 
      posts.id,
      author_id,
      CONCAT(users.first_name, ' ', users.last_name) AS author_name,
      title,
      CASE
        WHEN LENGTH(body) > 256
        THEN CONCAT(LEFT(body, 256), '...')
        ELSE body
      END AS body,
      created_at,
      updated_at
    FROM posts
    JOIN users ON posts.author_id = users.id
    ORDER BY updated_at DESC
    OFFSET $1
    FETCH FIRST $2 ROWS ONLY`,
      [offset, limit],
    );
    // console.log("models/posts ", rows);
    return rows as PostObject[];
  }
}

export async function getPostsCount() {
  const { rows } = await db.query(`SELECT COUNT(id) AS count FROM posts`);
  return rows[0].count as number;
}

type CreatePostPayload = {
  author_id: string;
  title: string;
  body: string;
};
export async function createPost({
  author_id,
  title,
  body,
}: CreatePostPayload) {
  const { rows } = await db.query(
    `INSERT INTO
    posts (author_id, title, body)
    VALUES
    ($1, $2, $3)
    RETURNING id
`,
    [author_id, title, body],
  );
  const id = rows[0].id as number;
  return id;
}

export async function getPostById(id: number, canViewAllData: boolean) {
  if (canViewAllData) {
    const { rows } = await db.query(
      `SELECT
    posts.id,
    author_id,
    CONCAT(users.first_name, ' ', users.last_name) AS author_name,
    title,
    body,
    created_at,
    updated_at
    FROM posts
    JOIN users ON
    posts.author_id = users.id
    WHERE posts.id = $1`,
      [id],
    );
    const post = rows[0] as PostObject | undefined;
    return post;
  } else {
    const { rows } = await db.query(
      `SELECT
    posts.id,
    author_id,
    'Anonymous' AS author_name,
    title,
    body,
    created_at,
    updated_at
    FROM posts
    JOIN users ON
    posts.author_id = users.id
    WHERE posts.id = $1`,
      [id],
    );
    const post = rows[0] as PostObject | undefined;
    return post;
  }
}

type UpdatePostByIdPayload = {
  title: string;
  body: string;
};
export async function updatePostById(
  id: number,
  { title, body }: UpdatePostByIdPayload,
) {
  await db.query(
    `UPDATE posts
    SET
      title = $1,
      body = $2,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $3`,
    [title, body, id],
  );
}

export async function deletePostById(id: number) {
  await db.query(`DELETE FROM posts WHERE id = $1`, [id]);
}
