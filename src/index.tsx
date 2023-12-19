import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import TestApp from './TestApp.tsx';
import { ContextModel } from './models/context-model.ts';

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

window.ContextModel = new ContextModel();

ReactDOM.createRoot(document.getElementById('root')!).render(<App context={window.ContextModel} />);
// ReactDOM.createRoot(document.getElementById('root')!).render(<TestApp context={window.ContextModel} />);
