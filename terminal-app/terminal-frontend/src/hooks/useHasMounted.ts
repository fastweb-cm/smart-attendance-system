import { useState, useEffect } from "react";

export function useHasMounted() {
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setHasMounted(true);
  }, []);
  return hasMounted;
}
