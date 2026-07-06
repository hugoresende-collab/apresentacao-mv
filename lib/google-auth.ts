import { google } from "googleapis";

function getRedirectUri(baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, "")}/api/google/callback`;
}

function createOAuthClient(baseUrl: string) {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    getRedirectUri(baseUrl)
  );
}

export function getAuthUrl(baseUrl: string, state: string): string {
  const oauth2Client = createOAuthClient(baseUrl);
  return oauth2Client.generateAuthUrl({
    access_type: "online",
    scope: ["https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"],
    include_granted_scopes: true,
    state,
  });
}

export interface GoogleUserInfo {
  email: string;
  name: string;
  picture?: string;
}

export async function getUserInfo(code: string, baseUrl: string): Promise<GoogleUserInfo> {
  const oauth2Client = createOAuthClient(baseUrl);
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();

  if (!data.email) {
    throw new Error("Google não retornou um email para esta conta.");
  }

  return {
    email: data.email,
    name: data.name || data.email.split("@")[0],
    picture: data.picture || undefined,
  };
}
