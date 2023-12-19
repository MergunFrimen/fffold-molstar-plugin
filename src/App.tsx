import { MolstarViewer } from './extension/MolstarViewer';
import { ContextModel } from './models/context-model';

export default function App({ context }: { context: ContextModel }) {
    return <MolstarViewer context={context} />;
}
