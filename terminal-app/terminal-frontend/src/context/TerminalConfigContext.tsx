"use client";

import React, { createContext, useContext } from "react";
import { terminalConfiguration } from "@/types";

//create the context
const TerminalConfigContext = createContext<terminalConfiguration | null>(null);

export function TerminalConfigProvider(
    {children, config}: {children: React.ReactNode, config: terminalConfiguration}
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
