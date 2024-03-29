import { Sequence } from 'molstar/lib/mol-plugin-ui/sequence/sequence';
import { SequenceWrapper } from 'molstar/lib/mol-plugin-ui/sequence/wrapper';
import { UUID } from 'molstar/lib/mol-util';
import { OptimizedCategory } from '../index';

type FFFoldSequenceProps = {
    sequenceWrapper: SequenceWrapper.Any;
    sequenceNumberPeriod?: number;
    hideSequenceNumbers?: boolean;
};

export class FFFoldSequence extends Sequence<FFFoldSequenceProps> {
    categoryColorMap: Record<OptimizedCategory, string> = {
        'Highly optimized rezidue': 'rgb(90, 155, 256)',
        'Optimized rezidue': 'rgb(147, 218, 246)',
        'Not optimized residue': 'rgb(255, 167, 99)',
    };
    otherColors = {
        highlighted: 'rgb(255, 102, 153)',
        selected: 'rgb(51, 255, 25)',
    };

    protected updateMarker() {
        if (!this.parentDiv.current) return;
        const xs = this.parentDiv.current.querySelectorAll('.msp-sequence-missing, .msp-sequence-present');
        const { markerArray } = this.props.sequenceWrapper;

        for (let i = 0, il = markerArray.length; i < il; i++) {
            const span = xs[i] as HTMLSpanElement | undefined;
            if (!span) continue;

            const backgroundColor = this.getColor(markerArray[i], i);
            if (span.style.backgroundColor !== backgroundColor) span.style.backgroundColor = backgroundColor;
        }
    }

    private getColor(marker: number, seqIdx?: number) {
        let color = '';

        const data = window.JsonData;
        if (data === undefined) {
            console.error('JSON data not loaded');
            return '';
        }
        for (const entry of data) {
            if (entry['residue index'] - 1 === seqIdx) {
                const category = entry['category'];
                color = this.categoryColorMap[category];
            }
        }

        if (marker === 0) {
            return color;
        } else if (marker % 2 === 0) {
            return this.otherColors.selected;
        } else {
            return this.otherColors.highlighted;
        }
    }

    render() {
        const sw = this.props.sequenceWrapper;

        const elems: JSX.Element[] = [];

        elems[elems.length] = (
            <div key={UUID.createv4()} className="mb-3 flex flex-row gap-x-3">
                <div className="msp-sequence-secondary flex flex-row items-baseline gap-x-2">
                    <svg width="10" height="10">
                        <rect
                            width="10"
                            height="10"
                            style={{ fill: this.categoryColorMap['Highly optimized rezidue'] }}
                        />
                    </svg>
                    <div>Highly optimized rezidue</div>
                </div>

                <div className="msp-sequence-secondary flex flex-row items-baseline gap-x-2">
                    <svg width="10" height="10">
                        <rect width="10" height="10" style={{ fill: this.categoryColorMap['Optimized rezidue'] }} />
                    </svg>
                    <div>Optimized residue</div>
                </div>
                <div className="msp-sequence-secondary flex flex-row items-baseline gap-x-2">
                    <svg width="10" height="10">
                        <rect width="10" height="10" style={{ fill: this.categoryColorMap['Not optimized residue'] }} />
                    </svg>
                    <div>Not optimized residue</div>
                </div>
            </div>
        );

        const hasNumbers = !this.props.hideSequenceNumbers,
            period = this.sequenceNumberPeriod;
        for (let i = 0, il = sw.length; i < il; ++i) {
            const label = sw.residueLabel(i);
            // add sequence number before name so the html element do not get separated by a line-break
            if (hasNumbers && i % period === 0 && i < il) {
                elems[elems.length] = this.getSequenceNumberSpan(i, label);
            }
            elems[elems.length] = this.residue(i, label, sw.markerArray[i]);
        }

        // calling .updateMarker here is neccesary to ensure existing
        // residue spans are updated as react won't update them
        setTimeout(() => this.updateMarker(), 500);

        return (
            <div
                className="msp-sequence-wrapper"
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
