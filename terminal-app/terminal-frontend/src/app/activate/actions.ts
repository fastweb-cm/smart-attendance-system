"use server";

import fs from "fs";
import path from "path";
import { terminalConfiguration } from "@/types";


async function activate(newConfig: terminalConfiguration, configPath: string): Promise<{ success: boolean; message: string; config?: terminalConfiguration}> {
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
    return { success: true, message: "Terminal activated successfully", config: newConfig };
}

export async function activateTerminal(activationCode: string): Promise<{ success: boolean; message: string; config?: terminalConfiguration}> {
    const configDir = path.join(process.cwd(), 'terminal-configs');
    const configPath = path.join(configDir, "config.json");

    //ensure the dir exists
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir);
    }

    //mock central validation
    if (activationCode !== "AAAA-BBBB"){
        return { success: false, message: "Invalid activation code" };
    }

    //if config already exists
    if (fs.existsSync(configPath)){
        const existingConfig: terminalConfiguration = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        if (existingConfig.status === "active"){
            return { success: false, message: "Terminal is already activated", config: existingConfig };
        }

        if (existingConfig.status === "revoked") {
            // now allow reactivation if previously revoked
            const newConfig: terminalConfiguration = { ...existingConfig, status: "active" };
            return activate(newConfig, configPath);
        }
    }

    //activate terminal
    const newConfig: terminalConfiguration = { status: "active" } as terminalConfiguration;
    return activate(newConfig, configPath);
}
