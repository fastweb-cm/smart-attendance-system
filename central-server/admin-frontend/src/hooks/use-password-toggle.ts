import { useState } from "react"

export function usePasswordToggle() {
  const [visible, setVisible] = useState(false)

  const type = visible ? "text" : "password"
  const toggle = () => setVisible(v => !v)

  return { visible, type, toggle }
}
