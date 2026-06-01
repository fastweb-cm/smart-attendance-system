
import { TerminalConfig } from "@/types";
import fs from "fs"
import path from "path";

export function loadTerminalConfig(): TerminalConfig | null {
    const configDir = process.env.TERMINAL_CONFIG_DIR || path.join(process.cwd(), 'terminal-configs');

    const configPath = path.join(configDir, "config.json"); 

    // If configPath is just a directory, existsSync returns true, 
    // but we must make sure it is actually a FILE.
    if (!fs.existsSync(configPath) || fs.lstatSync(configPath).isDirectory()) {
        return null;
    }

    try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        return config;
    } catch (error) {
        console.error("Failed to parse config.json", error);
        return null;
    }
}

//convert base64 image to blob
export function base64ToBlob(base64: string, type = "image/png") {
  const binary = atob(base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
  return new Blob([array], { type });
}

export function base64ToBuffer(base64: string | null) {
  if (!base64) return null;
  return Buffer.from(base64, "base64");
}
