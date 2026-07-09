import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

// Next 16 ships flat config natively — no FlatCompat needed.
const eslintConfig = [
  ...coreWebVitals,
  ...typescript,
  { ignores: ["dist/**", ".next/**", "node_modules/**"] },
];

export default eslintConfig;
