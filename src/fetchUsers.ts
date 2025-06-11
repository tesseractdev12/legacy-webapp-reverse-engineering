import crypto from "crypto";

export async function fetchWithAuth(url: string, cookie?: string) {
  const headers: HeadersInit = {
    Accept: "application/json"
  };
  if (cookie) {
    headers["Cookie"] = cookie;
  }

  const res = await fetch(url, { headers ,method: "POST" });

  if (res.status === 401) throw new Error("Unauthorized - session expired");

  const contentType = res.headers.get("content-type") || "";
  const body = await res.text();
  console.log("Response body:", body);

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }

  if (contentType.includes("application/json")) {
    return JSON.parse(body);
  } else {
    throw new Error("Unexpected non-JSON response");
  }
}



export async function fetchTokenData(url:string,cookie:string): Promise<{
  access_token: string;
  openId: string;
  userId: string;
  apiuser: string;
  operateId: string;
  language: string;
}> {
  const headers: HeadersInit = {
     Accept: "text/html",
  };
  if (cookie) {
    headers["Cookie"] = cookie;
  }
  const res = await fetch(url, {
    headers,
    method: "GET",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch token page: ${res.status}`);
  }

  const html = await res.text();

  const extractValue = (id: string): string => {
    const match = html.match(
      new RegExp(`<input[^>]*id="${id}"[^>]*value="([^"]+)"`)
    );
    if (!match) {
      throw new Error(`Token field ${id} not found in response`);
    }
    return match[1];
  };

  return {
    access_token: extractValue("access_token"),
    openId: extractValue("openId"),
    userId: extractValue("userId"),
    apiuser: extractValue("apiuser"),
    operateId: extractValue("operateId"),
    language: extractValue("language"),
  };
}

// c702d5b17c9ffe27790d2c9ca06d79485246ca2f69b0bc9c907e8fa9630cf8f7
// apiuser
// demo@example.org
// language
// en_US
// openId
// openid456
// operateId
// op789
// timestamp
// 1749581048
// userId
// 0000f32e-f62b-4f04-9ccf-fc0b8d32a033
// checkcode
// 4D96E868ADA95EF64A4A8B956BD410AB677859CD
export async function fetchCurrentUser(url:string,cookie:string,params:any): Promise<any> {
  
  const { checkcode, timestamp } = createSignedRequest(params, "mys3cr3t");
  params.append("checkcode", checkcode);
  params.append("timestamp", timestamp);
  console.log(params,"params");
  
const headers: HeadersInit = {
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
  };
  if (cookie) {
    headers["Cookie"] = cookie;
  }
  const res = await fetch(url, {
    headers,
    body: params.toString(),
    method: "POST",
  });

console.log(res,"res");


  if (!res.ok) {
    throw new Error(`Failed to fetch current user: ${res.status}`);
  }

  return await res.json();
}



interface Params {
  [key: string]: string;
}

export function createSignedRequest(t: Params, secretKey: string) {
  const timestamp = Math.floor(Date.now() / 1000).toString();

  // Add timestamp to the payload
  const withTimestamp: { [key: string]: string } = {
    ...t,
    timestamp
  };

  // Sort keys and create query string
  const payload = Object.keys(withTimestamp)
    .sort()
    .map(key => `${key}=${encodeURIComponent(withTimestamp[key])}`)
    .join("&");

  // Generate HMAC-SHA1 checkcode
  const hmac = crypto.createHmac("sha1", secretKey);
  hmac.update(payload);
  const checkcode = hmac.digest("hex").toUpperCase();

  return {
    checkcode,
    timestamp
  };
}
