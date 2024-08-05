export declare const trim: (text: string, delimiter: string) => string;
export declare const split: (text: string, delimeter: string | RegExp) => string[];
export declare const endAfterLabel: (label: string) => (text: string) => boolean;
export declare const sections: (content: string) => string[];
export declare const lines: (content: string) => string[];
export declare const parseLabeled: (data: string) => Record<string, string>;
