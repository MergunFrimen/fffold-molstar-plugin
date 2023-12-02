import { ContextModel } from '../models/context-model';
import { PluginUIComponent } from 'molstar/lib/mol-plugin-ui/base';
import { SequenceView } from './SequenceView';
import { PluginContextContainer } from 'molstar/lib/mol-plugin-ui/plugin';
import { Viewport, ViewportControls } from 'molstar/lib/mol-plugin-ui/viewport';
import { BackgroundTaskProgress } from 'molstar/lib/mol-plugin-ui/task';
import { Toasts } from 'molstar/lib/mol-plugin-ui/toast';
import {
    AnimationViewportControls,
    LociLabels,
    StateSnapshotViewportControls,
    TrajectoryViewportControls,
    SelectionViewportControls,
} from 'molstar/lib/mol-plugin-ui/controls';
import 'molstar/lib/mol-plugin-ui/skin/light.scss';

export function MolstarViewer({ context }: { context: ContextModel }) {
    const MolstarViewport = context.molstar.spec.components?.viewport?.view || DefaultViewport;

    return (
        <div className="flex grow h-full w-full flex-col outline outline-1">
            <div className="relative h-[100px]">
                <PluginContextContainer plugin={context.molstar}>
                    <SequenceView />
                </PluginContextContainer>
            </div>
            <div className="relative grow">
                <PluginContextContainer plugin={context.molstar}>
                    <MolstarViewport />
                </PluginContextContainer>
            </div>
        </div>
    );
}

export class DefaultViewport extends PluginUIComponent {
    render() {
        const VPControls = this.plugin.spec.components?.viewport?.controls || ViewportControls;

        return (
            <>
                <Viewport />
                <div className="msp-viewport-top-left-controls">
                    <AnimationViewportControls />
                    <TrajectoryViewportControls />
                    <StateSnapshotViewportControls />
                </div>
                <SelectionViewportControls />
                <VPControls />
                <BackgroundTaskProgress />
                <div className="msp-highlight-toast-wrapper">
                    <LociLabels />
                    <Toasts />
                </div>
            </>
        );
    }
}
