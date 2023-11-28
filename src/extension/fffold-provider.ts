/**
 * Copyright (c) 2019-2020 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 */

import { MmcifFormat } from 'molstar/lib/mol-model-formats/structure/mmcif';
import { CustomProperty } from 'molstar/lib/mol-model-props/common/custom-property';
import { CustomStructureProperty } from 'molstar/lib/mol-model-props/common/custom-structure-property';
import { CustomPropertyDescriptor } from 'molstar/lib/mol-model/custom-property';
import { Structure } from 'molstar/lib/mol-model/structure';
import { SecondaryStructure } from 'molstar/lib/mol-model/structure/model/properties/seconday-structure';
import { ParamDefinition as PD } from 'molstar/lib/mol-util/param-definition';

export interface SBNcbrPartialChargeData {}

export const SecondaryStructureParams = {};
export type SecondaryStructureParams = typeof SecondaryStructureParams;
const DefaultSecondaryStructureParams = PD.clone(SecondaryStructureParams);

function getParams() {
    return DefaultSecondaryStructureParams;
}

export type SecondaryStructureValue = Map<number, SecondaryStructure>;

export const SecondaryStructureProvider: CustomStructureProperty.Provider<
    SecondaryStructureParams,
    SecondaryStructureValue
> = CustomStructureProperty.createProvider({
    label: 'Secondary Structure',
    descriptor: CustomPropertyDescriptor({
        name: 'molstar_computed_secondary_structure',
        // TODO `cifExport` and `symbol`
    }),
    type: 'root',
    defaultParams: DefaultSecondaryStructureParams,
    getParams: () => getParams(),
    isApplicable: () => true,
    obtain: async (_ctx: CustomProperty.Context, structure: Structure) => Promise.resolve(getData(structure)),
});

// not necessary
export function hasProperties(structure: Structure): boolean {
    if (!structure || !MmcifFormat.is(structure.model.sourceData)) return false;
    const { categories } = structure.model.sourceData.data.frame;
    return (
        'sb_ncbr_residue_index' in categories &&
        'sb_ncbr_residue_name' in categories &&
        'sb_ncbr_optimized' in categories
    );
}

const PropertyKey = 'sb-ncbr-partial-charges-property-data';

function getData(structure: Structure): CustomProperty.Data<SBNcbrPartialChargeData | undefined> {
    if (PropertyKey in structure.model._staticPropertyData) {
        return structure.model._staticPropertyData[PropertyKey];
    }

    let data;

    if (!SecondaryStructureProvider.isApplicable(structure)) {
        data = { value: undefined };
    } else {
        data = {
            value: {
                typeIdToMethod: getTypeIdToMethod(structure),
            },
        };
    }

    structure.model._staticPropertyData[PropertyKey] = data;
    return data;
}

function getTypeIdToMethod(structure: Structure) {
    const typeIdToMethod = new Map();

    const sourceData = structure.model.sourceData as MmcifFormat;
    const rowCount = sourceData.data.frame.categories.sb_ncbr_partial_atomic_charges_meta.rowCount;
    const typeIds = sourceData.data.frame.categories.sb_ncbr_partial_atomic_charges_meta.getField('id');
    const methods = sourceData.data.frame.categories.sb_ncbr_partial_atomic_charges_meta.getField('method');

    if (!typeIds || !methods) {
        return typeIdToMethod;
    }

    for (let i = 0; i < rowCount; ++i) {
        const typeId = typeIds.int(i);
        const method = methods.str(i);
        typeIdToMethod.set(typeId, method);
    }

    return typeIdToMethod;
}
