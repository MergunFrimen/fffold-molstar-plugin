import { MolstarViewer } from './extension/MolstarViewer';
import { ContextModel } from './models/context-model';

export interface OptimizedJson {
    'residue index': number;
    'residue name': string;
    optimized: true;
}

declare global {
    interface Window {
        JsonData: OptimizedJson[];
        ContextModel: ContextModel;
    }
}

export default function App() {
    window.ContextModel = new ContextModel();
    return <MolstarViewer context={window.ContextModel} />;
}
