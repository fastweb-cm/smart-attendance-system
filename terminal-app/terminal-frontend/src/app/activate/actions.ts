"use server";

import fs from "fs";
import path from "path";

type TerminalStatus = 'pending' | 'active' | 'revoked';
interface TerminalConfig {
  terminal_id: number;
  name: string;
  terminal_code: string;
  branch: string;
  status: TerminalStatus;
  auth_capabilities: {
    auth_type_id: number;
    auth_type: string;
  }[];
  access_rule: {
    group_id: number | null;
    subgroup_id: number | null;
    auth_type_id: number;
  }[];
  access_policy: {
    group_id: number | null;
    subgroup_id: number | null;
    auth_type_id: number;
    auth_step: number;
  }[];
}

//mock realistic terminal config
const newConfig: TerminalConfig = {
    terminal_id: 1,
    name: "Main Gate Terminal",
    terminal_code: "SSEC-001",
    branch: "BAMENDA CAMPUS",
    status: "active",
    auth_capabilities: [
      {
        auth_type_id: 1,
        auth_type: "RFID CARD"
      },
      {
        auth_type_id: 2,
        auth_type: "FACE"
      }
    ],
    access_rule: [
      {
        group_id: 1,
        subgroup_id: null,
        auth_type_id: 1
      },
      {
        group_id: 1,
        subgroup_id: null,
        auth_type_id: 2
      }
    ],
    access_policy: [
      {
        group_id: 1,
        subgroup_id: null,
        auth_type_id: 1,
        auth_step: 1
      },
      {
        group_id: 1,
        subgroup_id: null,
        auth_type_id: 2,
        auth_step: 2
      }
    ]
};

async function activate(newConfig: TerminalConfig, configPath: string): Promise<{ success: boolean; message: string; config?: TerminalConfig}> {
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
    return { success: true, message: "Terminal activated successfully", config: newConfig };
}

export async function activateTerminal(activationCode: string): Promise<{ success: boolean; message: string; config?: TerminalConfig}> {
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
        const existingConfig: TerminalConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        if (existingConfig.status === "active"){
            return { success: false, message: "Terminal is already activated", config: existingConfig };
        }

        if (existingConfig.status === "revoked") {
            // now allow reactivation if previously revoked
            return activate(newConfig, configPath);
        }
    }

    //activate terminal
    return activate(newConfig, configPath);
}
