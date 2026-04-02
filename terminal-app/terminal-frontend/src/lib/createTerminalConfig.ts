"use server";

import fs from "fs";
import path from "path";
import { terminalConfiguration } from "@/types";

export async function createTerminalConfig(data: terminalConfiguration) {
    const configDir = path.join(process.cwd(), 'terminal-configs');
    const configPath = path.join(configDir, "config.json");
    
    //ensure the dir exists
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir);
    }

    // commit the configuration file
    fs.writeFileSync(configPath,JSON.stringify({
        id: data.id,
        name: data.name,
        branch_id: data.branch_id,
        slug: data.slug,
        branch: data.branch,
        status: data.status,
        auth_capabilities: data.auth_capabilities,
        auth_policy: data.access_policy,
    },null, 2));
}
