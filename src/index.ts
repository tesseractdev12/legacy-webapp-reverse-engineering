import fs from "fs";
import path from "path";
import { login, getSavedCookie } from "./auth";
import { fetchCurrentUser, fetchTokenData, fetchWithAuth } from "./fetchUsers";

const USERS_API = "https://challenge.sunvoy.com/api/users";
const FETCH_TOKEN_API = "https://challenge.sunvoy.com/settings/tokens";
const CURRENT_USER_API = "https://api.challenge.sunvoy.com/api/settings";
const OUTPUT_FILE = path.resolve("users.json");
async function main(): Promise<void> {
  let cookie = getSavedCookie();

  try {
    if (!cookie) {
      console.log("No saved session. Logging in...");
      cookie = await login();
    }

    const users = await fetchWithAuth(USERS_API,cookie);

    const tokenData = await fetchTokenData(FETCH_TOKEN_API,cookie);
      const params = new URLSearchParams({...tokenData});

    // const currentUser = await fetchCurrentUser(CURRENT_USER_API,cookie,params);

    const result = {
      users,
    //   currentUser
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2));
    console.log("Saved data to users.json");
  } catch (error: any) {
    if (error.message.includes("Unauthorized")) {
      console.log("Session expired. Re-logging in...");
    //   cookie = await login();
    }

    console.error("Unexpected error:", error);
  }
}

main();
