
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
