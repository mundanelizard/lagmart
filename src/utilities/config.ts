import * as path from 'path'
import { config } from 'dotenv'
config({ path: path.join(__dirname, "../../.env") });

export const PORT = process.env.PORT;
export const STATIC = process.env.STATIC || "public";
