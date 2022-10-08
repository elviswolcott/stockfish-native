import { EOL } from "os";

export const trim = (text: string, delimiter: string): string => {
  return text
    .replace(new RegExp(`^${delimiter}*`), "")
    .replace(new RegExp(`${delimiter}*$`), "");
};

export const split = (text: string, delimeter: string | RegExp): string[] => {
  return text.split(delimeter).map((s) => s.trim());
};

export const endAfterLabel = (label: string) => {
  return (text: string): boolean => Boolean(text.match(`${label}: .*${EOL}`));
};

export const sections = (content: string): string[] =>
  split(content, EOL.repeat(2));

export const lines = (content: string): string[] => split(content, EOL);

export const parseLabeled = (data: string): Record<string, string> => {
  return lines(data).reduce((parsed, line) => {
    const [label, value] = split(line, ":");
    parsed[label] = value;
    return parsed;
  }, {} as Record<string, string>);
};
