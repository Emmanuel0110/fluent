import { flagCodes } from "../constants/languages";

interface FlagIconProps {
  languageLabel: string;
  className?: string;
}

export function FlagIcon({ languageLabel, className = "" }: FlagIconProps) {
  const code = flagCodes[languageLabel];
  if (!code) return null;
  return <span className={`fi fi-${code} ${className}`.trim()} />;
}
