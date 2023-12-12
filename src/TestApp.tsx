import { MolstarViewer } from './extension/MolstarViewer';
import { ContextModel } from './models/context-model';

export default function TestApp() {
    window.ContextModel = new ContextModel();
    const optimizedStructureUrl = 'http://127.0.0.1:5500/test-data/optimized.cif';
    const originalStructureUrl = 'http://127.0.0.1:5500/test-data/original.pdb';
    const residueLogsUrl = 'http://127.0.0.1:5500/test-data/residues-logs.json';
    window.ContextModel.init(optimizedStructureUrl, originalStructureUrl, residueLogsUrl);

    return (
        <div className="relative flex h-screen w-screen flex-col gap-3 p-3">
            <div className="flex flex-row gap-x-10">
                <div className="flex flex-col items-start gap-y-2">
                    <Button label="Cartoon" onClick={() => window.ContextModel.changeView('cartoon')} />
                    <Button label="Ball and stick" onClick={() => window.ContextModel.changeView('ball-and-stick')} />
                    <Button label="Surface" onClick={() => window.ContextModel.changeView('gaussian-surface')} />
                </div>
                <div className="flex flex-col items-start gap-y-2">
                    <Button label="Structure" onClick={() => window.ContextModel.changeColor('element-symbol')} />
                    <Button
                        label="Model confidence"
                        onClick={() => window.ContextModel.changeColor('plddt-confidence')}
                    />
                </div>
                <div className="flex flex-col items-start gap-y-2">
                    <Button label="Show optimized" onClick={() => window.ContextModel.toggleVisibility()} />
                </div>
            </div>
            <MolstarViewer context={window.ContextModel} />
        </div>
    );
}

export function Button({ label, onClick }: { label: string; onClick: () => void }) {
    return (
        <button className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700" onClick={onClick}>
            {label}
        </button>
    );
}
