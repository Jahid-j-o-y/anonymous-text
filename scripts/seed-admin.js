import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// Load .env.local and .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, "../.env.local") });
dotenv.config({ path: resolve(__dirname, "../.env") });

const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123456";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_NAME = "System Administrator";

if (!MONGODB_URI) {
  console.error("❌ Error: MONGODB_URI is not set in environment or .env.local file.");
  process.exit(1);
}

function getFallbackUri(uri) {
  try {
    if (!uri.startsWith("mongodb+srv://")) return null;
    const match = uri.match(/^mongodb\+srv:\/\/([^:]+):([^@]+)@([^/?]+)(?:\/([^?]*))?(?:\?(.*))?$/);
    if (!match) return null;
    const [, user, pass, host, dbName] = match;
    const db = dbName || "anonymous_text";
    if (host.includes("anonymous-text.rvcviac.mongodb.net")) {
      return `mongodb://${user}:${pass}@ac-mxc1qxl-shard-00-00.rvcviac.mongodb.net:27017,ac-mxc1qxl-shard-00-01.rvcviac.mongodb.net:27017,ac-mxc1qxl-shard-00-02.rvcviac.mongodb.net:27017/${db}?ssl=true&replicaSet=atlas-6w71xb-shard-0&authSource=admin&retryWrites=true&w=majority`;
    }
  } catch {
    return null;
  }
  return null;
}

const UserSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    username: { type: String, required: true, unique: true, lowercase: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isBlocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function seedAdmin() {
  try {
    console.log("Connecting to MongoDB Atlas...");
    try {
      await mongoose.connect(MONGODB_URI, { bufferCommands: false });
    } catch (err) {
      if (err.message && (err.message.includes("querySrv") || err.code === "ECONNREFUSED")) {
        const fallback = getFallbackUri(MONGODB_URI);
        if (fallback) {
          console.log("ℹ️ Local network refused SRV DNS. Using direct replica set fallback...");
          await mongoose.connect(fallback, { bufferCommands: false });
        } else {
          throw err;
        }
      } else {
        throw err;
      }
    }

    console.log("Connected to MongoDB successfully!");

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, salt);

    const existingAdmin = await User.findOne({
      $or: [{ email: ADMIN_EMAIL.toLowerCase() }, { username: ADMIN_USERNAME.toLowerCase() }],
    });

    if (existingAdmin) {
      console.log(`Found existing admin account (@${existingAdmin.username}). Updating password and ensuring admin role...`);
      existingAdmin.fullName = ADMIN_NAME;
      existingAdmin.role = "admin";
      existingAdmin.isBlocked = false;
      existingAdmin.passwordHash = passwordHash;
      await existingAdmin.save();
      console.log("✅ Admin account updated successfully!");
    } else {
      console.log("Creating new admin account...");
      await User.create({
        fullName: ADMIN_NAME,
        username: ADMIN_USERNAME.toLowerCase(),
        email: ADMIN_EMAIL.toLowerCase(),
        passwordHash,
        role: "admin",
        isBlocked: false,
      });
      console.log("✅ Admin account created successfully!");
    }

    console.log("-----------------------------------------");
    console.log(`Email:    ${ADMIN_EMAIL}`);
    console.log(`Username: ${ADMIN_USERNAME}`);
    console.log(`Password: ${ADMIN_PASSWORD}`);
    console.log(`Role:     admin`);
    console.log("-----------------------------------------");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to seed admin:", error.message || error);
    process.exit(1);
  }
}

seedAdmin();
