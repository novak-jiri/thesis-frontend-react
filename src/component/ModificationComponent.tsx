import styles from "../main.module.scss";
import {SelectInput} from "./SelectInput";
import {SequenceEnum, SequenceEnumHelper} from "../enum/SequenceEnum";
import ModificationInput from "./ModificationInput";
import * as React from "react";
import Modification from "../structure/Modification";

interface Props {
    blockLength: number;
    sequenceType?: string;
    sequence?: string;
    modifications?: Modification[];
}

class ModificationComponent extends React.Component<Props, any> {

    nModificationRef: React.RefObject<ModificationInput>;
    cModificationRef: React.RefObject<ModificationInput>;
    bModificationRef: React.RefObject<ModificationInput>;

    constructor(props: Props) {
        super(props);
        this.nModificationRef = React.createRef();
        this.cModificationRef = React.createRef();
        this.bModificationRef = React.createRef();
        this.updateModifications = this.updateModifications.bind(this);
    }

    componentDidMount(): void {
        let txtType = document.getElementById('sel-sequence-type') as HTMLSelectElement;
        let typeEnum = SequenceEnumHelper.getValue(this.props.sequenceType ?? SequenceEnumHelper.getName(SequenceEnum.OTHER));
        txtType!.value = typeEnum.toString();
        this.disable(typeEnum);
    }

    private disable(value: SequenceEnum) {
        switch (value) {
            case SequenceEnum.LINEAR:
            case SequenceEnum.LINEAR_POLYKETIDE:
                this.nModificationRef.current!.unDisable();
                this.cModificationRef.current!.unDisable();
                this.bModificationRef.current!.disable();
                break;
            case SequenceEnum.CYCLIC:
            case SequenceEnum.CYCLIC_POLYKETIDE:
                this.nModificationRef.current!.disable();
                this.cModificationRef.current!.disable();
                this.bModificationRef.current!.disable();
                break;
            case SequenceEnum.BRANCH_CYCLIC:
                this.nModificationRef.current!.disable();
                this.cModificationRef.current!.disable();
                this.bModificationRef.current!.unDisable();
                break;
            default:
            case SequenceEnum.OTHER:
            case SequenceEnum.BRANCHED:
                this.nModificationRef.current!.unDisable();
                this.cModificationRef.current!.unDisable();
                this.bModificationRef.current!.unDisable();
                break;
        }
    }

    updateModifications() {
        let txtType = document.getElementById('sel-sequence-type') as HTMLSelectElement;
        this.disable(parseInt(txtType.value));
    }

    render() {
        return (
            <div id="div-sequence">
                <div id="div-top-sequence" className={styles.divLeft}>
                    <h3>Sequence - {this.props.blockLength} blocks</h3>

                    <label htmlFor="sel-sequence-type">Type</label>
                    <SelectInput id='sel-sequence-type' name='sel-sequence-type' options={SequenceEnumHelper.getOptions()} onChange={this.updateModifications} />

                    <label htmlFor="txt-sequence">Sequence</label>
                    <input type="text" id="txt-sequence" name="sequence" size={60} value={this.props.sequence}/>
                </div>
                <ModificationInput type='n' title='N-terminal modification' modifications={this.props.modifications}
                                   ref={this.nModificationRef}/>
                <ModificationInput type='c' title='C-terminal modification' modifications={this.props.modifications}
                                   ref={this.cModificationRef}/>
                <ModificationInput type='b' title='Branch-terminal modification'
                                   modifications={this.props.modifications} ref={this.bModificationRef}/>
            </div>
        );
    }

}

export default ModificationComponent;