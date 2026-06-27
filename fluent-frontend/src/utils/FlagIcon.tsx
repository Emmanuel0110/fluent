import { flagCodes } from "../constants/languages";
import "./FlagIcon.css";
import frFlag from "flag-icons/flags/4x3/fr.svg";
import gbFlag from "flag-icons/flags/4x3/gb.svg";
import krFlag from "flag-icons/flags/4x3/kr.svg";

// Only bundle the flags for the languages the app supports, keyed by country
// code (see flagCodes), instead of loading the full flag-icons CSS/SVG set.
const flagSvgs: Record<string, string> = {
  fr: frFlag,
  gb: gbFlag,
  kr: krFlag,
};

interface FlagIconProps {
  languageLabel: string;
  className?: string;
}

export function FlagIcon({ languageLabel, className = "" }: FlagIconProps) {
  const code = flagCodes[languageLabel];
  const src = code ? flagSvgs[code] : undefined;
  if (!src) return null;
  return <span className={`fi ${className}`.trim()} style={{ backgroundImage: `url(${src})` }} />;
}
