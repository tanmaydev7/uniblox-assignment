import { db } from "../db";
import { adminUsers } from "../db/schema/adminUsers";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

async function createAdminUser(username: string, password: string) {
  try {
    // Validate inputs
    if (!username || username.trim().length === 0) {
      console.error("Error: Username is required");
      process.exit(1);
    }

    if (!password || password.trim().length === 0) {
      console.error("Error: Password is required");
      process.exit(1);
    }

    const trimmedUsername = username.trim();

    // Check if admin user already exists
    const existingAdmin = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.username, trimmedUsername))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.error(`Error: Admin user with username "${trimmedUsername}" already exists`);
      process.exit(1);
    }

    // Hash the password
    const saltRounds = 10;
    console.log("Hashing password...");
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert the admin user
    console.log(`Creating admin user "${trimmedUsername}"...`);
    const newAdmin = await db
      .insert(adminUsers)
      .values({
        username: trimmedUsername,
        password: hashedPassword,
      })
      .returning();

    console.log(`✅ Successfully created admin user!`);
    console.log(`   ID: ${newAdmin[0].id}`);
    console.log(`   Username: ${newAdmin[0].username}`);
    console.log(`   Created at: ${newAdmin[0].createdAt}`);
  } catch (error: any) {
    console.error("Error creating admin user:", error.message || error);
    process.exit(1);
  }
}

// Get command-line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error("Usage: npm run create-admin -- <username> <password>");
  console.error("Example: npm run create-admin -- admin mypassword123");
  console.error("");
  console.error("Or run directly:");
  console.error("  ts-node-dev --transpile-only src/scripts/createAdminUser.ts <username> <password>");
  process.exit(1);
}

const [username, password] = args;

// Run the function
createAdminUser(username, password)
  .then(() => {
    console.log("Admin user creation completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Admin user creation failed:", error);
    process.exit(1);
  });

