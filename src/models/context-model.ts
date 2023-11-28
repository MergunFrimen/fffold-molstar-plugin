/* eslint-disable @typescript-eslint/no-unsafe-return */
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { DefaultPluginUISpec, PluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';

export const pluginUISpec: PluginUISpec = {
    ...DefaultPluginUISpec(),
};

export class ContextModel {
    molstar: PluginUIContext;

    async clear() {
        await this.molstar.clear();
    }

    async load(url: string) {
        console.log(url);
        const response = await fetch(url);
        const cif = await response.text();
        const data = await this.molstar.builders.data.rawData({ data: cif });
        const trajectory = await this.molstar.builders.structure.parseTrajectory(data, 'pdb');
        await this.molstar.builders.structure.hierarchy.applyPreset(trajectory, 'default');
    }

    constructor() {
        this.molstar = new PluginUIContext(pluginUISpec);
        void this.molstar.init();

        this.load('https://alphafold.ebi.ac.uk/files/AF-L8BU87-F1-model_v4.pdb');
    }
}
