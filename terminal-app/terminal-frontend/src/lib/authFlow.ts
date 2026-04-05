import { AuthCapabilities, AuthStep, AuthType } from "@/types";


export function buildAuthFlow(capabilities: AuthCapabilities[]): AuthStep[] {
    return capabilities
        // Filter out any items missing the required data to avoid runtime errors
        .filter((cap): cap is Required<AuthCapabilities> => 
            cap.auth_step !== undefined && cap.auth_type_name !== undefined
        )
        .sort((a, b) => a.auth_step - b.auth_step)
        .map((cap) => ({
            step: cap.auth_step,
            type: cap.auth_type_name as AuthType,
            type_id: cap.auth_type_id
        }))
}
