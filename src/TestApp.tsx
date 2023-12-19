import { MolstarViewer } from './extension/MolstarViewer';
import { ContextModel } from './models/context-model';

export default function TestApp({ context }: { context: ContextModel }) {
    const optimizedStructureUrl = 'http://127.0.0.1:5500/test-data/optimized.cif';
    const originalStructureUrl = 'http://127.0.0.1:5500/test-data/original.pdb';
    const residueLogsUrl = 'http://127.0.0.1:5500/test-data/residues-logs.json';
    context.init(optimizedStructureUrl, originalStructureUrl, residueLogsUrl);

    return (
        <div className="relative flex h-screen w-screen flex-col gap-3 p-3">
            <div className="flex flex-row gap-x-10">
                <div className="flex flex-col items-start gap-y-2">
                    <Button label="Cartoon" onClick={() => context.changeView('cartoon')} />
                    <Button label="Ball and stick" onClick={() => context.changeView('ball-and-stick')} />
                    <Button label="Surface" onClick={() => context.changeView('gaussian-surface')} />
                </div>
                <div className="flex flex-col items-start gap-y-2">
                    <Button label="Structure" onClick={() => context.changeColor('element-symbol')} />
                    <Button label="Model confidence" onClick={() => context.changeColor('plddt-confidence')} />
                </div>
                <div className="flex flex-col items-start gap-y-2">
                    <Button label="Show optimized" onClick={() => context.toggleVisibility()} />
                </div>
            </div>
            <MolstarViewer context={context} />
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
