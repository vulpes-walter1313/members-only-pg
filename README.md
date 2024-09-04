# TOP Members Only Project

This project is an exercise from [the odin project](https://www.theodinproject.com/lessons/node-path-nodejs-members-only).


## Starting a dev enviroment

There are several scripts that need to be ran at the same time manually. I tried concurrently but ran into some issues, but running them manually seemed to do the trick.

The commands areas follows:

```Bash
npm run dev

npm run tw-watch

npm run watch-cpa

```

Run the commands above in different terminals. Once they are all running, any changes will reflect in the project.


## Models

the data model only consists of two models.

1. users
2. posts

### users table

```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(24),
  last_name VARCHAR(24),
  username VARCHAR(320) NOT NULL UNIQUE,
  password TEXT NOT NULL,
  is_member BOOLEAN NOT NULL,
  is_admin BOOLEAN NOT NULL
);
```

### posts table

```sql
CREATE TABLE IF NOT EXISTS posts (
  id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  author_id uuid NOT NULL,
  title VARCHAR(256),
  body VARCHAR(2048),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);
```

### Users Module

This module will take care of working on the `users` db table

#### createUser

Arguments:


## Routes

### GET `/` homepage

This route shows a paginated view of all posts. When user is not logged in, it will show the post:

1. title
2. body
3. created_at
4. updated_at
5. Anonymous user (instead of showing the authors name)

When the user is logged in, this page will show the post:

1. title
2. body
3. author's name
4. created_at
5. updated_at

### GET `/signup`

This route will return a page with a simple signup html form with the following inputs:

1. first name
2. last name
3. email(username)
4. password
5. confirm_password

### POST `/signup`

this route will validate the data and on success, will redirect the user to the GET `/login` route. On validation failure, it will rerender the GET `/signup` route view.

### GET `/login`

this route will return a page with a login form.

1. username(email)
2. password

### POST `/login`

This route will validate credentials and if successful, it will send them to `/`. on failure the login view will be rerendered.

### GET `/membership`

When logged in, this route will return a page where the user can input a secret membership password that will grant them membership access.

When not logged in, it will redirect to the `/login` route.

The html form will just have

1. password

### POST `/membership`

This route will validate and check that `password` is correct and on success, will grant the user `is_member = true` and redirect them to GET `/welcome-new-member`. On failure, it will rerender GET `/membership`.

### GET `/become-an-admin`

This route will return a page that has an html form asking for the admin password.

### POST `/become-an-admin`

On success, this grants the logged in user `is_admin = true` in the `users` db table. on failure, it will rerender GET `/become-an-admin`.

### GET `/welcome-new-member`

This route will return a page that shows a screen welcoming a logged in user for becoming a member. This is the landing page after successfully becoming a member in the `/membership` route.

### GET `/post/create`

This route will return a page with an html form to create a post. The form should have the following inputs

1. title
2. body (write your story)

`title` should be a max length of 256 characters. `body` should be a max length of 2048 characters.

### POST `/post/create`

This route will validate and escape the user data to pass onto the DB.

It will receive the following body as url encoded body

```json
{
  "title": "Some title here",
  "body": "Some story here"
}
```

### GET `/post/:postId`

#### user logged in AND is a member

The post will be displayed with all the data such as:

1. title
2. body
3. created_at
4. updated_at
5. author_name

#### user not logged in OR logged in user is NOT member

The post will be displayed with the author will be 'Anonymous'. The data will be displayed as follows:

1. title
2. body
3. created_at
4. updated_at
5. Author: Anonymous

#### user logged in AND user is the author of the post OR user is an admin

Aside from seeing all of the post information, there will be buttons to edit and delete the post.

### GET `/post/:postId/update`

If user is the author or admin, this route will send an html form that's the same as GET `/post/create`. If user is not author, admin, or logged in user then user will be redirected to `/`.

### POST `/post/:postId/update`

This route will validate and escape the data. On success, it will update the post data in the DB. On failure, it will rerender the GET `/post/:postId/update` route.

### GET `/post/:postId/delete`

This returns a page to confirm if you really want to delete a page. If user is not author, admin, or logged in user then user will be redirected to `/`.

### POST `/post/:postId/delete`

this route will verify that the user can delete the post. if not redirect them to `/`.
