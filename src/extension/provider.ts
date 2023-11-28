/**
 * Copyright (c) 2019-2020 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 */

import { Structure } from "molstar/lib/mol-model/structure";
import {
  DSSPComputationParams,
  DSSPComputationProps,
  computeUnitDSSP,
} from "molstar/lib/mol-model-props/computed/secondary-structure/dssp";
import { SecondaryStructure } from "molstar/lib/mol-model/structure/model/properties/seconday-structure";
import { ParamDefinition as PD } from "molstar/lib/mol-util/param-definition";
import { Unit } from "molstar/lib/mol-model/structure/structure";
import { CustomStructureProperty } from "molstar/lib/mol-model-props/common/custom-structure-property";
import { CustomProperty } from "molstar/lib/mol-model-props/common/custom-property";
import { ModelSecondaryStructure } from "molstar/lib/mol-model-formats/structure/property/secondary-structure";
import { CustomPropertyDescriptor } from "molstar/lib/mol-model/custom-property";
import { Model } from "molstar/lib/mol-model/structure/model";
import { MmcifFormat } from "molstar/lib/mol-model-formats/structure/mmcif";

function getSecondaryStructureParams(data?: Structure) {
  let defaultType = "model" as "model" | "dssp";
  if (data) {
    defaultType = "dssp";
    for (let i = 0, il = data.models.length; i < il; ++i) {
      const m = data.models[i];
      if (Model.isFromPdbArchive(m) || Model.hasSecondaryStructure(m)) {
        // if there is any secondary structure definition given or if there is
        // an archival model, don't calculate dssp by default
        defaultType = "model";
        break;
      }
    }
  }
  return {
    type: PD.MappedStatic(
      defaultType,
      {
        model: PD.EmptyGroup({ label: "Model" }),
        dssp: PD.Group(DSSPComputationParams, { label: "DSSP", isFlat: true }),
      },
      {
        options: [
          ["model", "Model"],
          ["dssp", "DSSP"],
        ],
      }
    ),
  };
}

export const SecondaryStructureParams = getSecondaryStructureParams();
export type SecondaryStructureParams = typeof SecondaryStructureParams;
export type SecondaryStructureProps = PD.Values<SecondaryStructureParams>;

/** Maps `unit.id` to `SecondaryStructure` */
export type SecondaryStructureValue = Map<number, SecondaryStructure>;

export const SecondaryStructureProvider: CustomStructureProperty.Provider<
  SecondaryStructureParams,
  SecondaryStructureValue
> = CustomStructureProperty.createProvider({
  label: "Secondary Structure",
  descriptor: CustomPropertyDescriptor({
    name: "molstar_computed_secondary_structure",
    // TODO `cifExport` and `symbol`
  }),
  type: "root",
  defaultParams: SecondaryStructureParams,
  getParams: getSecondaryStructureParams,
  isApplicable: () => true,
  obtain: async (
    ctx: CustomProperty.Context,
    data: Structure,
    props: Partial<SecondaryStructureProps>
  ) => {
    const p = { ...PD.getDefaultValues(SecondaryStructureParams), ...props };
    switch (p.type.name) {
      case "dssp":
        return { value: await computeDssp(data, p.type.params) };
      case "model":
        return { value: await computeModel(data) };
    }
  },
});

// not necessary
export function hasProperties(structure: Structure): boolean {
  console.log(!structure || !MmcifFormat.is(structure.model.sourceData));
  if (!structure || !MmcifFormat.is(structure.model.sourceData)) return false;
  const { categories } = structure.model.sourceData.data.frame;
  return (
    "atom_site" in categories &&
    "sb_ncbr_partial_atomic_charges" in categories &&
    "sb_ncbr_partial_atomic_charges_meta" in categories
  );
}

async function computeDssp(
  structure: Structure,
  props: DSSPComputationProps
): Promise<SecondaryStructureValue> {
  // TODO take inter-unit hbonds into account for bridge, ladder, sheet assignment
  // TODO use Zhang-Skolnik for CA alpha only parts or for coarse parts with per-residue elements
  const map = new Map<number, SecondaryStructure>();
  for (let i = 0, il = structure.unitSymmetryGroups.length; i < il; ++i) {
    const u = structure.unitSymmetryGroups[i].units[0];
    if (Unit.isAtomic(u) && !Model.isCoarseGrained(u.model)) {
      const secondaryStructure = await computeUnitDSSP(u, props);
      map.set(u.invariantId, secondaryStructure);
    }
  }
  return map;
}

async function computeModel(
  structure: Structure
): Promise<SecondaryStructureValue> {
  const map = new Map<number, SecondaryStructure>();
  for (let i = 0, il = structure.unitSymmetryGroups.length; i < il; ++i) {
    const u = structure.unitSymmetryGroups[i].units[0];
    if (Unit.isAtomic(u)) {
      const secondaryStructure = ModelSecondaryStructure.Provider.get(u.model);
      if (secondaryStructure) {
        map.set(u.invariantId, secondaryStructure);
      }
    }
  }
  return map;
}
