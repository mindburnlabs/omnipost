import { PostgrestClient } from "@supabase/postgrest-js";

const POSTGREST_URL = process.env.POSTGREST_URL || "";
const POSTGREST_SCHEMA = process.env.POSTGREST_SCHEMA || "public";
const POSTGREST_API_KEY = process.env.POSTGREST_API_KEY || "";

export function createPostgrestClient(userToken?: string) {
  // Validate environment variables
  if (!POSTGREST_URL) {
    throw new Error('POSTGREST_URL environment variable is not set');
  }
  if (!POSTGREST_SCHEMA) {
    throw new Error('POSTGREST_SCHEMA environment variable is not set');
  }
  if (!POSTGREST_API_KEY) {
    throw new Error('POSTGREST_API_KEY environment variable is not set');
  }

  const client = new PostgrestClient(POSTGREST_URL, {
    schema: POSTGREST_SCHEMA,
    fetch: async (...args) => {
      let [url, options] = args;

      if (url instanceof URL || typeof url === "string") {
        const urlObj = url instanceof URL ? url : new URL(url);
        const columns = urlObj.searchParams.get("columns");

        if (columns && columns.includes('"')) {
          const fixedColumns = columns.replace(/"/g, "");
          urlObj.searchParams.set("columns", fixedColumns);
          url = urlObj.toString();
        }
      }

      try {
        const response = await fetch(url, {
          ...options,
        } as RequestInit);

        // Add better error handling for connection issues
        if (!response.ok && response.status === 0) {
          throw new Error(`Database connection failed: Unable to connect to PostgREST server at ${POSTGREST_URL}`);
        }
        
        return response;
      } catch (error) {
        if (error instanceof TypeError && error.message.includes('fetch')) {
          throw new Error(`Database connection failed: PostgREST server at ${POSTGREST_URL} is not reachable. Please ensure the database service is running.`);
        }
        throw error;
      }
    },
  });

  client.headers.set("Content-Type", "application/json");

  if (userToken) {
    client.headers.set("Authorization", `Bearer ${userToken}`);
  }

  if (POSTGREST_API_KEY) {
    client.headers.set("apikey", POSTGREST_API_KEY);
  }
  return client;
}
