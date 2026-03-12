
import { TerminalConfig } from "@/types";
import fs from "fs"
import path from "path";

export function loadTerminalConfig(): TerminalConfig | null {
    const configPath = path.join(process.cwd(),"terminal-configs","config.json");

    if(!fs.existsSync(configPath)){
        return null;
    }

    const config = JSON.parse(fs.readFileSync(configPath,'utf-8'));

    return config;
}

//convert base64 image to blob
export function base64ToBlob(base64: string, type = "image/png") {
  const binary = atob(base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
  return new Blob([array], { type });
}
