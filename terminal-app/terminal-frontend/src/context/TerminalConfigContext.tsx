"use client";

import React, { createContext, useContext } from "react";
import { TerminalConfiguration } from "@/types";

//create the context
const TerminalConfigContext = createContext<TerminalConfiguration | null>(null);

export function TerminalConfigProvider(
    {children, config}: {children: React.ReactNode, config: TerminalConfiguration}
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
