/**
 * Copyright (c) 2018-2023 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Yakov Pechersky <ffxen158@gmail.com>
 */

import { Structure, StructureElement, Unit } from 'molstar/lib/mol-model/structure';
import { SecondaryStructureProvider } from './provider';
import { ModelSecondaryStructure } from 'molstar/lib/mol-model-formats/structure/property/secondary-structure';
import { Sequence } from 'molstar/lib/mol-plugin-ui/sequence/sequence';
import { SequenceWrapper } from 'molstar/lib/mol-plugin-ui/sequence/wrapper';

type SecondaryStructureSequenceProps = {
    sequenceWrapper: SequenceWrapper.Any;
    sequenceNumberPeriod?: number;
    hideSequenceNumbers?: boolean;
    hideSecondaryStructure?: boolean;
};

export class SecondaryStructureSequence extends Sequence<SecondaryStructureSequenceProps> {
    protected updateMarker() {
        if (!this.parentDiv.current) return;
        const xs = this.parentDiv.current.querySelectorAll('.msp-sequence-missing, .msp-sequence-present');
        const { markerArray } = this.props.sequenceWrapper;
        const secondarySpanDiv = this.parentDiv.current.querySelector('.msp-sequence-secondary');
        const emptySS = !!secondarySpanDiv && /^[\s\u200b]+$/.test(secondarySpanDiv.textContent ?? '');
        const overlays = [' '];

        for (let i = 0, il = markerArray.length; i < il; i++) {
            const span = xs[i] as HTMLSpanElement | undefined;
            if (!span) continue;

            const backgroundColor = this.getBackgroundColor(markerArray[i], i);
            if (span.style.backgroundColor !== backgroundColor) span.style.backgroundColor = backgroundColor;
        }
        if (emptySS) {
            secondarySpanDiv.textContent = overlays.join('\u200b');
        }
    }

    private override getBackgroundColor(marker: number, seqIdx?: number) {
        // TODO: make marker color configurable
        if (typeof marker === 'undefined') console.error('unexpected marker value');

        const data = window.JsonData;
        if (data === undefined) console.error('data not loaded');
        let color = '';
        for (const entry of data) {
            if (entry['residue index'] - 1 === seqIdx) {
                color = entry.optimized ? 'rgb(102, 161, 255)' : 'rgb(255, 102, 102)';
            }
        }

        if (seqIdx) color = seqIdx % 2 === 0 ? 'rgb(102, 161, 255)' : 'rgb(255, 102, 102)';

        return marker === 0
            ? color // normal
            : marker % 2 === 0
              ? 'rgb(51, 255, 25)' // selected
              : 'rgb(255, 102, 153)'; // highlighted
    }

    protected getSequenceNumberClass(seqIdx: number, seqNum: string, label: string) {
        const suffix = this.props.hideSecondaryStructure ? '' : ' msp-sequence-number-above';
        return super.getSequenceNumberClass(seqIdx, seqNum, label) + suffix;
    }

    protected secondaryStructureKind(i: number): string {
        const loci = this.props.sequenceWrapper.getLoci(i);
        const l = StructureElement.Loci.getFirstLocation(loci, this.location);
        if (!l || !Unit.isAtomic(l.unit)) return ' ';
        const secStruc = SecondaryStructureProvider.get(l.structure).value?.get(l.unit.invariantId);
        if (!secStruc) return ' ';
        const elem = secStruc.elements[secStruc.key[secStruc.getIndex(l.unit.residueIndex[l.element])]];
        if (!elem) return ' ';
        return elem.kind !== 'none' ? elem.kind : ' ';
    }

    render() {
        const sw = this.props.sequenceWrapper;
        const structure: Structure = this.props.sequenceWrapper.data.structure;
        const secondaryStructure = ModelSecondaryStructure.Provider.get(structure.model);

        const elems: JSX.Element[] = [];

        elems[elems.length] = (
            <div className="mb-3 flex flex-row gap-x-3">
                <div className="msp-sequence-secondary flex flex-row items-baseline gap-x-2">
                    <svg width="10" height="10">
                        <rect width="10" height="10" style={{ fill: 'rgb(102, 161, 255)' }} />
                    </svg>
                    <div>Optimized residue</div>
                </div>
                <div className="msp-sequence-secondary flex flex-row items-baseline gap-x-2">
                    <svg width="10" height="10">
                        <rect width="10" height="10" style={{ fill: 'rgb(255, 102, 102)' }} />
                    </svg>
                    <div>Not optimized residue</div>
                </div>
            </div>
        );

        const hasNumbers = !this.props.hideSequenceNumbers,
            period = this.sequenceNumberPeriod;
        const overlays = [' '];
        for (let i = 0, il = sw.length; i < il; ++i) {
            const label = sw.residueLabel(i);
            // add sequence number before name so the html element do not get separated by a line-break
            if (hasNumbers && i % period === 0 && i < il) {
                elems[elems.length] = this.getSequenceNumberSpan(i, label);
            }
            elems[elems.length] = this.residue(i, label, sw.markerArray[i]);
            if (!this.props.hideSecondaryStructure) {
                if (!secondaryStructure) continue;
                const ss = this.secondaryStructureKind(i);
                overlays.push(ss[0]);
            }
        }

        // calling .updateMarker here is neccesary to ensure existing
        // residue spans are updated as react won't update them
        this.updateMarker();

        const className = this.props.hideSecondaryStructure
            ? 'msp-sequence-wrapper'
            : 'msp-sequence-wrapper msp-sequence-wrapper-secondary';

        return (
            <div
                className={className}
                onContextMenu={this.contextMenu}
                onMouseDown={this.mouseDown}
                onMouseUp={this.mouseUp}
                onMouseMove={this.mouseMove}
                onMouseLeave={this.mouseLeave}
                ref={this.parentDiv}
            >
                {elems}
            </div>
        );
    }
}
function rgb(arg0: number, arg1: number, arg2: number): import('csstype').Property.Fill | undefined {
    throw new Error('Function not implemented.');
}
