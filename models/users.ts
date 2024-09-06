import db from "../db/pool";

export type UserObject = {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  password: string;
  is_member: boolean;
  is_admin: boolean;
};

type CreateUserPayload = {
  first_name: string;
  last_name: string;
  username: string;
  password: string;
};
async function createUser({
  first_name,
  last_name,
  username,
  password,
}: CreateUserPayload) {
  await db.query(
    `INSERT INTO users
    (first_name, last_name, username, password, is_member, is_admin)
    VALUES
    ($1, $2, $3, $4, $5, $6)`,
    [first_name, last_name, username, password, false, false],
  );
}

async function getUserByEmail(email: string) {
  const { rows } = await db.query(`SELECT * FROM users WHERE username = $1`, [
    email,
  ]);
  const user = rows[0] as UserObject | undefined;
  return user;
}

async function updateUserMembership(id: string, membership: boolean) {
  await db.query(
    `
    UPDATE users
    SET is_member = $1
    WHERE id = $2
    `,
    [membership, id],
  );
}

export default {
  createUser,
  getUserByEmail,
  updateUserMembership,
};
