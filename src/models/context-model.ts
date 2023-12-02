/* eslint-disable @typescript-eslint/no-unsafe-return */
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { DefaultPluginUISpec, PluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';
import { MAQualityAssessment } from 'molstar/lib/extensions/model-archive/quality-assessment/behavior';
import { PluginSpec } from 'molstar/lib/mol-plugin/spec';
import optimizedJson from '../../public/optimized.json';
import { StateObjectSelector } from 'molstar/lib/mol-state';
import { PluginStateObject } from 'molstar/lib/mol-plugin-state/objects';
import { PluginCommands } from 'molstar/lib/mol-plugin/commands';
import { Color } from 'molstar/lib/mol-util/color';
import { BuiltInTrajectoryFormat } from 'molstar/lib/mol-plugin-state/formats/trajectory';
import { PLDDTConfidenceColorThemeProvider } from 'molstar/lib/extensions/model-archive/quality-assessment/color/plddt';

interface OptimizedJson {
    'residue index': number;
    'residue name': string;
    optimized: true;
}

// using the window object to store the data
// alternative would be to setup a structure provider
// but that would require a lot of work
declare global {
    interface Window {
        JsonData: OptimizedJson[];
    }
}

const pluginUISpec: PluginUISpec = {
    ...DefaultPluginUISpec(),
    behaviors: [...DefaultPluginUISpec().behaviors, PluginSpec.Behavior(MAQualityAssessment)],
};

export class ContextModel {
    private optimizedStructureUrl: string;
    private originalStructureUrl: string;
    private residueLogsUrl: string;

    private originalRef: StateObjectSelector<PluginStateObject.Molecule.Structure.Representation3D> | undefined;
    private optimizedRef: StateObjectSelector<PluginStateObject.Molecule.Structure.Representation3D> | undefined;

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
            type: 'ball-and-stick',
            color: 'element-symbol',
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

    async changeRepresentation(params: any) {
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
        });
    }

    async changeColorStructure() {
        this.changeRepresentation({
            color: 'element-symbol',
        });
    }

    async changeColorConfidence() {
        this.changeRepresentation({
            color: PLDDTConfidenceColorThemeProvider.name,
        });
    }

    async changeTypeBas() {
        this.changeRepresentation({
            type: 'ball-and-stick',
        });
    }

    async changeTypeCartoon() {
        this.changeRepresentation({
            type: 'cartoon',
        });
    }

    async changeTypeSurface() {
        this.changeRepresentation({
            type: 'gaussian-surface',
        });
    }

    async loadResidueLogs() {
        await fetch(this.optimizedStructureUrl);
        window.JsonData = optimizedJson as OptimizedJson[];
    }

    async init() {
        this.loadResidueLogs();
        await this.molstar.init();
        this.loadOptimizedStructure();
        this.loadOriginalStructure();
    }

    constructor(optimizedStructureUrl: string, originalStructureUrl: string, residueLogsUrl: string) {
        this.optimizedStructureUrl = optimizedStructureUrl;
        this.originalStructureUrl = originalStructureUrl;
        this.residueLogsUrl = residueLogsUrl;

        this.init();
    }
}
