import nextEnv from "@next/env";
import { fileURLToPath } from "node:url";

export const projectDirectory = fileURLToPath(new URL("../", import.meta.url));
nextEnv.loadEnvConfig(projectDirectory, true);
