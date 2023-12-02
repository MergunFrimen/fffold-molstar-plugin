import { useRef, useState } from 'react';
import { MolstarViewer } from './extension/MolstarViewer';
import { ContextModel } from './models/context-model';
('./extension/Context');

export default function App() {
    const context = useRef<ContextModel>();
    if (!context.current) context.current = new ContextModel('./optimized2.cif', './original.pdb', 'A');

    return (
        <div className="h-screen w-screen">
            <div className="flex h-full max-h-full w-full max-w-full flex-col">
                <ViewControls context={context.current} />
                <hr className="my-4" />
                <MolstarViewer context={context.current} />
            </div>
        </div>
    );
}

function Input({
    name,
    title,
    id,
    value,
    onChange,
    checked,
}: {
    name: string;
    id: string;
    value: string;
    title: string;
    checked?: boolean;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
    return (
        <div className="flex flex-row gap-2" title={title}>
            <input type="radio" name={name} id={id} value={value} onChange={onChange} checked={checked} />
            <label htmlFor={id}>{value}</label>
        </div>
    );
}

function ViewControls({ context }: { context: ContextModel }) {
    const [view, setView] = useState<'cartoon' | 'bas' | 'surface'>('bas');
    const [coloring, setColoring] = useState<'structure' | 'confidence'>('structure');
    const [showOptimized, setShowOptimized] = useState<boolean>(true);

    function handleViewChange(newView: 'cartoon' | 'bas' | 'surface') {
        const previous = view;
        setView(newView);
        switch (newView) {
            case 'cartoon':
                context.changeTypeCartoon();
                break;
            case 'bas':
                context.changeTypeBas();
                break;
            case 'surface':
                context.changeTypeSurface();
                break;
        }
        if (showOptimized) {
            if (previous === 'bas' && newView !== 'bas') {
                context.toggleOriginalVisibility();
            }
            if (previous !== 'bas' && newView === 'bas') {
                context.toggleOriginalVisibility();
            }
        }
    }

    function handleColorChange(newColor: 'structure' | 'confidence') {
        console.log('fire');
        setColoring(newColor);
        switch (newColor) {
            case 'structure':
                context.changeColorStructure();
                break;
            case 'confidence':
                context.changeColorConfidence();
                break;
        }
    }

    function handleOptimizedChange() {
        setShowOptimized(!showOptimized);
        context.toggleOriginalVisibility();
    }

    return (
        <div className="flex flex-row">
            <div className="flex basis-1/2 flex-col">
                <legend className="col font-bold">View</legend>

                <Input
                    name="view"
                    id="view_cartoon"
                    value="Cartoon"
                    title="Cartoon representation."
                    onChange={() => handleViewChange('cartoon')}
                    checked={view === 'cartoon'}
                />

                <Input
                    name="view"
                    id="view_surface"
                    value="Surface"
                    title="Surface representation."
                    onChange={() => handleViewChange('surface')}
                    checked={view === 'surface'}
                />

                <Input
                    name="view"
                    id="view_bas"
                    value="Ball &amp; Stick"
                    title="Ball &amp; Stick representation."
                    onChange={() => handleViewChange('bas')}
                    checked={view === 'bas'}
                />

                <div className="flex flex-row gap-2">
                    <input
                        type="checkbox"
                        id="view_non_optimized"
                        onChange={handleOptimizedChange}
                        checked={showOptimized}
                        disabled={view !== 'bas'}
                    />
                    <label htmlFor="view_non_optimized">Add non-optimized structure</label>
                </div>
            </div>

            <div className="flex flex-col">
                <legend className="font-bold">Coloring</legend>

                <Input
                    name="colors"
                    id="colors_structure"
                    value="Structure"
                    title="Use coloring based on the structure"
                    onChange={() => handleColorChange('structure')}
                    checked={coloring === 'structure'}
                />

                <Input
                    name="colors"
                    id="coloring_confidence"
                    value="Model confidence"
                    title="Use coloring based on AlphaFold model confidence (according pLDDT score)."
                    onChange={() => handleColorChange('confidence')}
                    checked={coloring === 'confidence'}
                />
            </div>
        </div>
    );
}
