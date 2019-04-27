declare const glob: any;
declare const path: any;
declare const globOptions: {
    ignore: string[];
};
declare const fileArgs: string[];
declare function getMatches(pattern: any): Promise<string[]>;
