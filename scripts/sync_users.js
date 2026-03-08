const { Client, Users, Databases, Permission, Role } = require("node-appwrite");

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APP_APPWRITE_KEY || process.env.APPWRITE_API_KEY);

const users = new Users(client);
const databases = new Databases(client);

async function syncUsers() {
  try {
    console.log("Fetching Auth Users...");
    const response = await users.list();

    console.log(`Found ${response.users.length} users. Syncing to DB...`);

    for (const authUser of response.users) {
      try {
        await databases.createDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
          "users",
          authUser.$id,
          {
            email: authUser.email.toLowerCase(),
            name: authUser.name || "Unknown User",
          },
          [
            Permission.read(Role.any()),
            Permission.update(Role.user(authUser.$id)),
            Permission.delete(Role.user(authUser.$id)),
          ]
        );
        console.log(`Synced user: ${authUser.name} (${authUser.$id})`);
      } catch (err) {
        if (err.code === 409) {
          console.log(
            `User already exists in DB: ${authUser.name} (${authUser.$id})`
          );
        } else {
          console.error(`Failed to sync user: ${authUser.$id}`, err.message);
        }
      }
    }
  } catch (error) {
    console.error("Error fetching users:", error.message);
    if (!process.env.APPWRITE_API_KEY && !process.env.APP_APPWRITE_KEY) {
      console.log(
        "Looking for APPWRITE_API_KEY in .env.local to access Auth users."
      );
    }
  }
}

syncUsers();
