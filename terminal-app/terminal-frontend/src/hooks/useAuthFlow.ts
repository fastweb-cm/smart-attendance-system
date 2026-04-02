"use client";

import { AuthStep } from "@/types";
import { useState } from "react";

export function useAuthFlow(steps: AuthStep[]) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  // eslint-disable-next-line
  const [identifiedUser, setIdentifiedUser] = useState<any>(null);
  const [allowedSteps, setAllowedSteps] = useState<string[] | null>(null);
  const [isComplete, setIsComplete] = useState(false); // Track if flow is done

  const currentStep = steps[currentStepIndex];

  const next = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      setIsComplete(true); // Final step reached
    }
  };

  const skip = () => next();

  // eslint-disable-next-line
  const setUser = (user: any, policy: any[]) => {
    setIdentifiedUser(user);

    // Filter policy by the user's specific group
    const userSteps = policy
      .filter(p => p.group_id === user.group_id)
      .map(p => p.auth_type_name);

    setAllowedSteps(userSteps);
  };

  const shouldAllowStep = (type: string) => {
    if (!allowedSteps) return true; 
    return allowedSteps.includes(type);
  };

  return {
    currentStep,
    currentStepIndex,
    next,
    skip,
    setUser,
    shouldAllowStep,
    isComplete,      // Useful for showing the final "Thank You" screen
  };
}
