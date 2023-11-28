import { createContext } from 'react';

interface OptimizedJson {
    'residue index': number;
    'residue name': string;
    optimized: true;
}

export const jsonContext = createContext<OptimizedJson | undefined>(undefined);
