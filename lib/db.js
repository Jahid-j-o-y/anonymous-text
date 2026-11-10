import mongoose from "mongoose";

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

/**
 * Converts a known MongoDB Atlas SRV URI into a direct replica set URI
 * as a fallback if the local ISP/network or Windows c-ares resolver blocks UDP SRV queries.
 */
function getFallbackUri(uri) {
  try {
    if (!uri.startsWith("mongodb+srv://")) return null;

    // Pattern: mongodb+srv://<user>:<pass>@anonymous-text.rvcviac.mongodb.net/<db>?<opts>
    const match = uri.match(/^mongodb\+srv:\/\/([^:]+):([^@]+)@([^/?]+)(?:\/([^?]*))?(?:\?(.*))?$/);
    if (!match) return null;

    const [, user, pass, host, dbName, query] = match;
    const db = dbName || "anonymous_text";

    if (host.includes("anonymous-text.rvcviac.mongodb.net")) {
      return `mongodb://${user}:${pass}@ac-mxc1qxl-shard-00-00.rvcviac.mongodb.net:27017,ac-mxc1qxl-shard-00-01.rvcviac.mongodb.net:27017,ac-mxc1qxl-shard-00-02.rvcviac.mongodb.net:27017/${db}?ssl=true&replicaSet=atlas-6w71xb-shard-0&authSource=admin&retryWrites=true&w=majority`;
    }
  } catch {
    return null;
  }
  return null;
}

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MongoDB URI is not configured. Please set MONGODB_URI in your environment variables or .env.local."
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
    };

    cached.promise = mongoose
      .connect(uri, opts)
      .catch((err) => {
        // If local DNS failed on SRV lookup (querySrv ECONNREFUSED)
        if (err.message && (err.message.includes("querySrv") || err.code === "ECONNREFUSED")) {
          const fallbackUri = getFallbackUri(uri);
          if (fallbackUri) {
            console.log("ℹ️ Standard SRV DNS blocked by local network. Connecting via direct Atlas replicaSet fallback...");
            return mongoose.connect(fallbackUri, opts);
          }
        }
        throw err;
      })
      .then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
