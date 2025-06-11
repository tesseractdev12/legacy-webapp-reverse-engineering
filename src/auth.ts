import path from "path";
import fetch from "node-fetch";
import fs from "fs";

const LOGIN_URL = "https://challenge.sunvoy.com/login";
const AUTH_FILE = path.resolve(".auth.json");

export function getSavedCookie(): string | null {
  if (!fs.existsSync(AUTH_FILE)) return null;

  const content = fs.readFileSync(AUTH_FILE, "utf-8").trim();
  if (!content) return null;

  try {
    const { cookie } = JSON.parse(content);
    return cookie ?? null;
  } catch (err) {
    console.error("Invalid JSON in auth file:", err);
    return null;
  }
}




export async function login() {
  // STEP 1: GET login page
  const res = await fetch(LOGIN_URL, { method: "GET" });
  const cookies = res.headers.raw()["set-cookie"] || [];
  const cookieHeader = cookies.map(c => c.split(";")[0]).join("; ");
  const html = await res.text();

  // STEP 2: Extract nonce token
  const nonceMatch = html.match(/name="nonce"\s+value="([^"]+)"/);
  if (!nonceMatch) throw new Error("nonce not found");
  const nonce = nonceMatch[1];
  console.log("Extracted nonce:", nonce);

  // STEP 3: Prepare form body
  const params = new URLSearchParams();
  params.append("username", "demo@example.org");
  params.append("password", "test");
  params.append("nonce", nonce);

  // STEP 4: POST login request
  const loginRes = await fetch(LOGIN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": cookieHeader,
      "Origin": "https://challenge.sunvoy.com",
      "Referer": LOGIN_URL,
    },
    body: params.toString(),
    redirect: "manual"
  });

  // STEP 5: Save session cookie
  const loginCookies = loginRes.headers.raw()["set-cookie"];
  if (!loginCookies) throw new Error("Login failed: No cookies");
  console.log("Login response cookies:", loginCookies);
  
  // const sessionCookie = loginCookies.find(c => c.includes("JSESSIONID="));
  const sessionCookies = loginCookies.map(c => c.split(";")[0]).join("; ");
  if (!sessionCookies) throw new Error("Login failed: No session cookie");

  fs.writeFileSync(".auth.json", JSON.stringify({ cookie: sessionCookies }, null, 2));
  console.log("Logged in and session saved.");
  return sessionCookies;
}
