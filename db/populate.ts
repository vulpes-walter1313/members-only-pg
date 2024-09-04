import "dotenv/config";
import { Client } from "pg";
import { type UserObject } from "../models/users";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";

async function main() {
  console.log(process.env.DB_URI);
  const client = new Client({ connectionString: process.env.DB_URI });

  try {
    console.log('connecting to db...');
    await client.connect();
    console.log('Connected to db');
    const users: Pick<
      UserObject,
      "first_name" | "last_name" | "username" | "password"
    >[] = [];
    const password = "pass1234";
    const hash = await bcrypt.hash(password, 10);
    for (let i = 0; i < 4; i++) {
      const user = {
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        username: faker.internet.email(),
        password: hash,
      };
      users.push(user);
    }
    await Promise.all(
      users.map(async (user) => {
        console.log("Creating user...");
        await client.query(
          `INSERT INTO users
        (first_name, last_name, username, password, is_member, is_admin)
        VALUES
        ($1, $2, $3, $4, $5, $6)`,
          [
            user.first_name,
            user.last_name,
            user.username,
            user.password,
            false,
            false,
          ],
        );
        console.log(`created user ${user.first_name}`);
      }),
    );
    console.log("Finished creating users.");

    const { rows: dbUSers } = await client.query(`SELECT * FROM users`);
    console.log(`creating posts...`);
    const posts: { author_id: string; title: string; body: string }[] = [];
    for (const user of dbUSers as UserObject[]) {
      console.log(`Creating posts for ${user.first_name}`);
      for (let i = 0; i < 5; i++) {
        const post = {
          author_id: user.id,
          title: faker.lorem.lines(1),
          body: faker.lorem.sentences({ min: 10, max: 30 }),
        };
        posts.push(post);
      }
    }
    await Promise.all(
      posts.map(async (post) => {
        await client.query(
          `INSERT INTO posts
          (author_id, title, body)
          VALUES
          ($1, $2, $3)`,
          [post.author_id, post.title, post.body],
        );
        console.log(`Finished inserting posts for ${post.author_id}`);
      }),
    );
    console.log("Finished successfully");
  } catch (err) {
    console.error(err);
    await client.end();
    process.exit(1);
  } finally {
    await client.end();
    process.exit(0);
  }
}

main();
