"use client";

import { AuthStep, AuthType, User } from "@/types";
import { useState, useCallback } from "react";

export function useAuthFlow(steps: AuthStep[]) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  // eslint-disable-next-line
  const [identifiedUser, setIdentifiedUser] = useState<User | null>(null);
  const [allowedSteps, setAllowedSteps] = useState<string[] | null>(null);
  const [isComplete, setIsComplete] = useState(false); // Track if flow is done
  const [completedTypes, setCompletedTypes] = useState<AuthType[]>([]); // Track completed auth types

  const currentStep = steps[currentStepIndex]; // which step are we curently at

  // moves to the next step, or marks flow as complete if on last step
  const next = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      setIsComplete(true);
    }
  }, [currentStepIndex, steps.length]);

  const skip = () => next();

  // Sets the identified user and determines which steps they are allowed to access based on their group_id, and/or subgroup_id(soon) and the provided policy. 
  // This is critical for the dynamic flow control, as it allows the app to show/hide steps based on user attributes. 
  // The policy is expected to be an array of objects that link group_ids to auth_type_names, which are then used to set the allowedSteps state.
  // eslint-disable-next-line
  const setUser = useCallback((user: User | null, policy: any[]) => {
  setIdentifiedUser(prev => {
    if (prev) return prev;

    const userSteps = policy
      .filter(p => p.group_id === user?.groupId)
      .map(p => p.auth_type_name);

    setAllowedSteps(userSteps);
    return user;
  });
}, []);

  // controls whether the current step should be shown based on if it's in the allowedSteps array. 
  // If allowedSteps is null, it means we haven't set permissions yet, so we allow all steps by default. 
  // Once set, only steps that match the user's group permissions will be allowed to show.
  // thus it controls the skipping logic
  const shouldAllowStep = useCallback((type: string) => {
    if (!allowedSteps) return true; 
    return allowedSteps.includes(type);
  }, [allowedSteps]);

  const jumpToStep = useCallback((type: AuthType) => {
    const targetIndex = steps.findIndex(s => s.type === type);
    if (targetIndex !== -1) {
      setCurrentStepIndex(targetIndex);
    }
  }, [steps]);// jump to a previously skipped step which may be required based on user group.

  const markStepCompleted = useCallback((type: AuthType) => {
    setCompletedTypes(prev => [...new Set([...prev, type])]);
  }, []);

  const reset = useCallback(() => {
    setCurrentStepIndex(0);
    setIdentifiedUser(null);
    setAllowedSteps(null);
    setIsComplete(false);
    setCompletedTypes([]);
  }, []);

  return {
    currentStep,
    currentStepIndex,
    next,
    skip,
    setUser,
    shouldAllowStep,
    isComplete,      // Useful for showing the final "Thank You" screen
    setIsComplete,
    reset,
    allowedSteps,
    identifiedUser,
    jumpToStep,
    markStepCompleted,
    completedTypes,
  };
}
