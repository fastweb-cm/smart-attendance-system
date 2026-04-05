"use client";

import React, { createContext, useContext } from "react";
import { TerminalConfig } from "@/types";

//create the context
const TerminalConfigContext = createContext<TerminalConfig | null>(null);

export function TerminalConfigProvider(
    {children, config}: {children: React.ReactNode, config: TerminalConfig}
) {
    return(
        <TerminalConfigContext.Provider value={config}>
            {children}
        </TerminalConfigContext.Provider>
    );
}

export function useTerminalConfig() {
    const context = useContext(TerminalConfigContext);

    return context;
}
