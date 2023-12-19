/* eslint-disable @typescript-eslint/no-unsafe-return */
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { DefaultPluginUISpec, PluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';
import { MAQualityAssessment } from 'molstar/lib/extensions/model-archive/quality-assessment/behavior';
import { PluginSpec } from 'molstar/lib/mol-plugin/spec';
import { StateObjectSelector } from 'molstar/lib/mol-state';
import { PluginStateObject } from 'molstar/lib/mol-plugin-state/objects';
import { PluginCommands } from 'molstar/lib/mol-plugin/commands';
import { Color } from 'molstar/lib/mol-util/color';
import { BuiltInTrajectoryFormat } from 'molstar/lib/mol-plugin-state/formats/trajectory';
import { StructureFocusRepresentation } from 'molstar/lib/mol-plugin/behavior/dynamic/selection/structure-focus-representation';
import { OptimizedJson } from '..';

const pluginUISpec: PluginUISpec = {
    ...DefaultPluginUISpec(),
    behaviors: [...DefaultPluginUISpec().behaviors, PluginSpec.Behavior(MAQualityAssessment)],
};

export class ContextModel {
    private optimizedStructureUrl: string = '';
    private originalStructureUrl: string = '';
    private residueLogsUrl: string = '';

    private originalRef: StateObjectSelector<PluginStateObject.Molecule.Structure.Representation3D> | undefined;
    private optimizedRef: StateObjectSelector<PluginStateObject.Molecule.Structure.Representation3D> | undefined;

    private currentView: 'cartoon' | 'ball-and-stick' | 'gaussian-surface' = 'ball-and-stick';
    private currentColor: 'element-symbol' | 'plddt-confidence' = 'element-symbol';
    private showOptimized: boolean = true;

    molstar: PluginUIContext = new PluginUIContext(pluginUISpec);

    async loadStructure(url: string, format: BuiltInTrajectoryFormat) {
        const response = await fetch(url);
        const rawData = await response.text();
        const data = await this.molstar.builders.data.rawData({ data: rawData });
        const trajectory = await this.molstar.builders.structure.parseTrajectory(data, format);
        const model = await this.molstar.builders.structure.createModel(trajectory);
        const modelProperties = await this.molstar.builders.structure.insertModelProperties(model);
        const structure = await this.molstar.builders.structure.createStructure(modelProperties || model);

        return structure;
    }

    async loadOptimizedStructure() {
        const structure = await this.loadStructure(this.optimizedStructureUrl, 'mmcif');
        const componentRef = await this.molstar.builders.structure.tryCreateComponentStatic(structure, 'all');
        this.optimizedRef = await this.molstar.builders.structure.representation.addRepresentation(componentRef!, {
            type: this.currentView,
            color: this.currentColor as any,
        });
    }

    async loadOriginalStructure() {
        const structure = await this.loadStructure(this.originalStructureUrl, 'pdb');
        const componentRef = await this.molstar.builders.structure.tryCreateComponentStatic(structure, 'all');
        this.originalRef = await this.molstar.builders.structure.representation.addRepresentation(componentRef!, {
            type: 'ball-and-stick',
            typeParams: { alpha: 0.5 },
            color: 'uniform',
            colorParams: { value: Color(0x969696) },
        });
    }

    async toggleOriginalVisibility() {
        this.molstar.dataTransaction(async () => {
            for (const s of this.molstar.managers.structure.hierarchy.current.structures) {
                const update = this.molstar.state.data.build();
                for (const c of s.components) {
                    for (const r of c.representations) {
                        if (r.cell.obj?.id === this.originalRef!.obj?.id) {
                            await PluginCommands.State.ToggleVisibility(this.molstar, {
                                state: r.cell.parent!,
                                ref: this.originalRef!.ref,
                            });
                        }
                    }
                }
                await update.commit();
            }
        });
    }

    async changeRepresentation(
        params: { color?: any; type?: any; colorParams?: any; typeParams?: any },
        color?: boolean
    ) {
        this.molstar.dataTransaction(async () => {
            for (const s of this.molstar.managers.structure.hierarchy.current.structures) {
                const update = this.molstar.state.data.build();
                for (const c of s.components) {
                    for (const r of c.representations) {
                        const oldParams = r.cell.transform.params;
                        const newParams = {
                            ...oldParams,
                            colorTheme: {
                                name: params.color || oldParams?.colorTheme.name,
                                params: params.colorParams || oldParams?.colorTheme.params,
                            },
                            type: {
                                name: params.type || oldParams?.type.name,
                                params: params.typeParams || oldParams?.type.params,
                            },
                        };

                        if (r.cell.obj?.id === this.optimizedRef!.obj?.id) {
                            update.to(r.cell).update(newParams);
                        }
                    }
                }
                await update.commit();
            }
            if (color) await this.updateFocusColorTheme(params.color, params.colorParams);
        });
    }

    async changeView(newView: 'cartoon' | 'ball-and-stick' | 'gaussian-surface') {
        const previous = this.currentView;
        this.currentView = newView;
        this.changeRepresentation({
            type: newView,
        });
        if (this.showOptimized) {
            if (previous === 'ball-and-stick' && newView !== 'ball-and-stick') {
                this.toggleOriginalVisibility();
            }
            if (previous !== 'ball-and-stick' && newView === 'ball-and-stick') {
                this.toggleOriginalVisibility();
            }
        }
    }

    async changeColor(newColor: 'element-symbol' | 'plddt-confidence') {
        this.currentColor = newColor;
        this.changeRepresentation(
            {
                color: newColor,
            },
            true
        );
    }

    async toggleVisibility() {
        if (this.currentView !== 'ball-and-stick') return;

        this.showOptimized = !this.showOptimized;
        this.toggleOriginalVisibility();
    }

    private async updateFocusColorTheme(color: any, params: any) {
        await this.molstar.state.updateBehavior(StructureFocusRepresentation, (p) => {
            p.targetParams.colorTheme = { name: color, params: params || p.targetParams.colorTheme.params };
            p.surroundingsParams.colorTheme = { name: color, params: params || p.surroundingsParams.colorTheme.params };
        });
    }

    async loadResidueLogs() {
        const response = await fetch(this.residueLogsUrl);
        const data = await response.json();
        window.JsonData = data as OptimizedJson[];
    }

    async init(optimizedStructureUrl: string, originalStructureUrl: string, residueLogsUrl: string) {
        this.optimizedStructureUrl = optimizedStructureUrl;
        this.originalStructureUrl = originalStructureUrl;
        this.residueLogsUrl = residueLogsUrl;

        await this.loadResidueLogs();
        await this.molstar.init();
        await this.loadOptimizedStructure();
        await this.loadOriginalStructure();
    }

    constructor() {}
}
