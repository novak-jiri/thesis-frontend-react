import * as React from "react";
import "react-app-polyfill/ie11";
import styles from "../main.module.scss"
import {CONTAINER, ELEMENT_LARGE_SMILES, SEQUENCE_EDIT, SEQUENCE_ID, SSEQUENCE, TOKEN} from "../constant/ApiConstants";
import Flash from "../component/Flash";
import PopupYesNo from "../component/PopupYesNo";
import ListComponent, {ListState} from "../component/ListComponent";
import {ServerEnumHelper} from "../enum/ServerEnum";
import Helper from "../helper/Helper";
import FetchHelper from "../helper/FetchHelper";
import FlashType from "../component/FlashType";
import {ERROR_LOGIN_NEEDED, ERROR_SOMETHING_GOES_WRONG} from "../constant/FlashConstants";
import ContainerHelper from "../helper/ContainerHelper";
// @ts-ignore
import * as SmilesDrawer from 'smiles-drawer';
import PopupSmilesDrawer from "../component/PopupSmilesDrawer";
import {
    SORT_B_MODIFICATION,
    SORT_C_MODIFICATION,
    SORT_FAMILY,
    SORT_ID,
    SORT_IDENTIFIER,
    SORT_N_MODIFICATION,
    SORT_ORGANISM,
    SORT_SEQUENCE,
    SORT_SEQUENCE_FORMULA,
    SORT_SEQUENCE_MASS,
    SORT_SEQUENCE_NAME,
    SORT_SEQUENCE_TYPE,
    TXT_FILTER_ORGANISM,
    TXT_FILTER_SEQUENCE,
    TXT_FILTER_SEQUENCE_B_MODIFICATION,
    TXT_FILTER_SEQUENCE_C_MODIFICATION,
    TXT_FILTER_SEQUENCE_FAMILY,
    TXT_FILTER_SEQUENCE_FORMULA,
    TXT_FILTER_SEQUENCE_ID,
    TXT_FILTER_SEQUENCE_IDENTIFIER,
    TXT_FILTER_SEQUENCE_MASS_FROM,
    TXT_FILTER_SEQUENCE_MASS_TO,
    TXT_FILTER_SEQUENCE_N_MODIFICATION,
    TXT_FILTER_SEQUENCE_NAME,
    TXT_FILTER_SEQUENCE_TYPE
} from "../constant/DefaultConstants";
import {DECIMAL_PLACES, ENDPOINT, SHOW_ID, URL_PREFIX} from "../constant/Constants";
import TextInput from "../component/TextInput";
import Creatable from "react-select/creatable";
import {SelectInput} from "../component/SelectInput";

let largeSmilesDrawer: SmilesDrawer.Drawer;

const TXT_EDIT_SEQUENCE_NAME = 'txt-edit-sequence-name';
const TXT_EDIT_SEQUENCE_TYPE = 'txt-edit-sequence-type';
const TXT_EDIT_SEQUENCE_FORMULA = 'txt-edit-sequence-formula';
const TXT_EDIT_SEQUENCE_MASS = 'txt-edit-sequence-mass';

interface State extends ListState {
    familyOptions: any[];
    organismOptions: any[];
    editFamily: any[];
    editOrganism: any[];
    lastEditBlockId: number;
}

const SEL_EDIT_SEQUENCE_SOURCE = 'sel-edit-sequence-source';

const TXT_EDIT_SEQUENCE_IDENTIFIER = 'txt-edit-sequence-identifier';

class SequencePage extends ListComponent<any, State> {

    popupSmilesRef: React.RefObject<PopupSmilesDrawer>;

    constructor(props: any) {
        super(props);
        this.popupSmilesRef = React.createRef();
        this.detail = this.detail.bind(this);
        this.clone = this.clone.bind(this);
        this.cloneTransformation = this.cloneTransformation.bind(this);
        this.filter = this.filter.bind(this);
        this.clear = this.clear.bind(this);
        this.fetchFamily = this.fetchFamily.bind(this);
        this.fetchOrganism = this.fetchOrganism.bind(this);
        this.familyEditChange = this.familyEditChange.bind(this);
        this.organismEditChange = this.organismEditChange.bind(this);
        this.state = {
            list: [],
            selectedContainer: this.props.match.params.id,
            selectedContainerName: ContainerHelper.getSelectedContainerName(),
            familyOptions: [],
            editFamily: [],
            organismOptions: [],
            editOrganism: [],
            lastEditBlockId: -1
        };
    }

    componentDidMount(): void {
        super.componentDidMount();
        this.fetchFamily();
        this.fetchOrganism();
        Helper.resetStorage();
        const large = document.getElementById(ELEMENT_LARGE_SMILES);
        largeSmilesDrawer = new SmilesDrawer.Drawer({
            width: large!.clientWidth,
            height: large!.clientHeight,
            compactDrawing: false,
        });
    }

    fetchFamily() {
        FetchHelper.fetch(this.getEndpoint() + '/family', 'GET', (data: any) => {
            this.setState({
                familyOptions: data.map((family: any) => {
                    return {value: family.id, label: family.family}
                })
            })
        });
    }

    fetchOrganism() {
        FetchHelper.fetch(ENDPOINT + 'container/' + this.state.selectedContainer + '/organism', 'GET', (data: any) => this.setState({
            organismOptions: data.map((family: any) => {
                return {value: family.id, label: family.family}
            })
        }));
    }

    familyEditChange(newValue: any) {
        this.setState({editFamily: newValue});
    }

    organismEditChange(newValue: any) {
        this.setState({editOrganism: newValue});
    }

    findName(key: number): string {
        return this.find(key).sequenceName;
    }

    getEndpoint() {
        return ENDPOINT + CONTAINER + '/' + this.state.selectedContainer + SSEQUENCE;
    }

    detail(key: number) {
        localStorage.setItem(SEQUENCE_EDIT, 'Yes');
        localStorage.setItem(SEQUENCE_ID, key.toString());
        document.location.href = URL_PREFIX;
    }

    clone(key: number) {
        FetchHelper.fetch(this.getEndpointWithId(key) + '/clone', 'POST', this.cloneTransformation, () => this.flashRef.current!.activate(FlashType.BAD, ERROR_SOMETHING_GOES_WRONG));
    }

    cloneTransformation() {
        this.flashRef.current!.activate(FlashType.OK);
        this.list();
    }

    filter() {
        Helper.sequenceFilter(this);
    }

    clear() {
        Helper.sequenceClear(this);
    }

    /**
     * Show popup with large result
     * @param smiles
     */
    showLargeSmiles(smiles: string) {
        this.popupSmilesRef.current!.activate();
        SmilesDrawer.parse(smiles, function (tree: any) {
            largeSmilesDrawer.draw(tree, ELEMENT_LARGE_SMILES);
        });
    }

    edit(blockId: number, family?: string, organism?: string): void {
        if ((organism || family) && this.state.lastEditBlockId !== blockId) {
                this.setState({
                editFamily: (family ?? '').split(',').map(familyName => this.state.familyOptions.find(fam => fam.label === familyName)).filter(value => value),
                editOrganism: (organism ?? '').split(',').map(organismName => this.state.organismOptions.find(org => org.label === organismName)).filter(value => value),
                editable: blockId,
                lastEditBlockId: blockId
            });
        } else {
            this.setState({editable: blockId, lastEditBlockId: blockId});
        }
    }

    render() {
        return (
            <section className={styles.page}>
                <section className={styles.pageTable}>
                    <PopupYesNo label={"Really want to delete"} onYes={this.delete} ref={this.popupRef}/>
                    <PopupSmilesDrawer id={ELEMENT_LARGE_SMILES} className={styles.popupLarge}
                                       ref={this.popupSmilesRef}/>
                    <Flash textBad='Failure!' textOk='Success!' ref={this.flashRef}/>
                    <h2>List of Sequences
                        - {this.state.selectedContainerName} - {this.state.list.length} rows</h2>
                    <table>
                        <thead>
                        <tr>
                            {SHOW_ID ? <th onClick={() => this.sortBy(SORT_ID)}>Id {this.sortIcons(SORT_ID)}</th> : ''}
                            <th onClick={() => this.sortBy(SORT_SEQUENCE_NAME)}>Sequence
                                name {this.sortIcons(SORT_SEQUENCE_NAME)}</th>
                            <th onClick={() => this.sortBy(SORT_SEQUENCE_TYPE)}>Type {this.sortIcons(SORT_SEQUENCE_TYPE)}</th>
                            <th onClick={() => this.sortBy(SORT_SEQUENCE)}>Sequence {this.sortIcons(SORT_SEQUENCE)}</th>
                            <th onClick={() => this.sortBy(SORT_SEQUENCE_FORMULA)}>Formula {this.sortIcons(SORT_SEQUENCE_FORMULA)}</th>
                            <th onClick={() => this.sortBy(SORT_SEQUENCE_MASS)}>Mass {this.sortIcons(SORT_SEQUENCE_MASS)}</th>
                            <th onClick={() => this.sortBy(SORT_FAMILY)}>Family {this.sortIcons(SORT_FAMILY)}</th>
                            <th onClick={() => this.sortBy(SORT_ORGANISM)}>Organism {this.sortIcons(SORT_ORGANISM)}</th>
                            <th onClick={() => this.sortBy(SORT_N_MODIFICATION)}>N {this.sortIcons(SORT_N_MODIFICATION)}</th>
                            <th onClick={() => this.sortBy(SORT_C_MODIFICATION)}>C {this.sortIcons(SORT_C_MODIFICATION)}</th>
                            <th onClick={() => this.sortBy(SORT_B_MODIFICATION)}>Branch {this.sortIcons(SORT_B_MODIFICATION)}</th>
                            <th onClick={() => this.sortBy(SORT_IDENTIFIER)}>Identifier {this.sortIcons(SORT_IDENTIFIER)}</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                            {SHOW_ID ?
                                <td><input className={styles.filter} type={'text'}
                                           onKeyDown={(e) => this.enterCall(e, this.filter)} id={TXT_FILTER_SEQUENCE_ID}
                                           placeholder={'Id'}/></td> : ''}
                            <td><input className={styles.filter} type={'text'}
                                       onKeyDown={(e) => this.enterCall(e, this.filter)} id={TXT_FILTER_SEQUENCE_NAME}
                                       placeholder={'Name'}/></td>
                            <td><input className={styles.filter} type={'text'}
                                       onKeyDown={(e) => this.enterCall(e, this.filter)} id={TXT_FILTER_SEQUENCE_TYPE}
                                       placeholder={'Type'}/></td>
                            <td><input className={styles.filter} type={'text'}
                                       onKeyDown={(e) => this.enterCall(e, this.filter)} id={TXT_FILTER_SEQUENCE}
                                       placeholder={'Sequence'}/></td>
                            <td><input className={styles.filter} type={'text'}
                                       onKeyDown={(e) => this.enterCall(e, this.filter)}
                                       id={TXT_FILTER_SEQUENCE_FORMULA} placeholder={'Formula'}/></td>
                            <td>
                                <input className={styles.filter} type={'text'}
                                       onKeyDown={(e) => this.enterCall(e, this.filter)}
                                       id={TXT_FILTER_SEQUENCE_MASS_FROM} placeholder={'Mass from'}/>
                                <input className={styles.filter} type={'text'}
                                       onKeyDown={(e) => this.enterCall(e, this.filter)}
                                       id={TXT_FILTER_SEQUENCE_MASS_TO} placeholder={'Mass to'}/>
                            </td>
                            <td><input className={styles.filter} type={'text'}
                                       onKeyDown={(e) => this.enterCall(e, this.filter)} id={TXT_FILTER_SEQUENCE_FAMILY}
                                       placeholder={'Family'}/></td>
                            <td><input className={styles.filter} type={'text'}
                                       onKeyDown={(e) => this.enterCall(e, this.filter)} id={TXT_FILTER_ORGANISM}
                                       placeholder={'Organism'}/></td>
                            <td><input className={styles.filter} type={'text'}
                                       onKeyDown={(e) => this.enterCall(e, this.filter)}
                                       id={TXT_FILTER_SEQUENCE_N_MODIFICATION} placeholder={'N Modification'}/></td>
                            <td><input className={styles.filter} type={'text'}
                                       onKeyDown={(e) => this.enterCall(e, this.filter)}
                                       id={TXT_FILTER_SEQUENCE_C_MODIFICATION} placeholder={'C Modification'}/></td>
                            <td><input className={styles.filter} type={'text'}
                                       onKeyDown={(e) => this.enterCall(e, this.filter)}
                                       id={TXT_FILTER_SEQUENCE_B_MODIFICATION} placeholder={'B Modification'}/></td>
                            <td><input className={styles.filter} type={'text'}
                                       onKeyDown={(e) => this.enterCall(e, this.filter)}
                                       id={TXT_FILTER_SEQUENCE_IDENTIFIER} placeholder={'Identifier'}/></td>
                            <td>
                                <button onClick={this.filter}>Filter</button>
                                <button className={styles.delete} onClick={this.clear}>Clear</button>
                            </td>
                        </tr>
                        {this.state.list.map(sequence => (
                            <tr key={sequence.id}>
                                {SHOW_ID ? <td>{sequence.id}</td> : ''}
                                <td onClick={() => this.edit(sequence.id, sequence.family, sequence.organism)}>{this.state.editable === sequence.id
                                    ? <TextInput className={styles.filter} name={TXT_EDIT_SEQUENCE_NAME}
                                                 id={TXT_EDIT_SEQUENCE_NAME} value={sequence.sequenceName}/>
                                    : sequence.sequenceName}</td>
                                <td onClick={() => this.edit(sequence.id, sequence.family, sequence.organism)}>{this.state.editable === sequence.id
                                    ? <TextInput className={styles.filter} id={TXT_EDIT_SEQUENCE_TYPE}
                                                 name={TXT_EDIT_SEQUENCE_TYPE} value={sequence.sequenceType}/>
                                    : sequence.sequenceType}</td>
                                <td>{sequence.sequence}</td>
                                <td onClick={() => this.edit(sequence.id, sequence.family, sequence.organism)}>{this.state.editable === sequence.id
                                    ? <TextInput className={styles.filter} name={TXT_EDIT_SEQUENCE_FORMULA}
                                                 id={TXT_EDIT_SEQUENCE_FORMULA} value={sequence.formula}/>
                                    : sequence.formula}</td>
                                <td onClick={() => this.edit(sequence.id, sequence.family, sequence.organism)}>{this.state.editable === sequence.id
                                    ? <TextInput className={styles.filter} name={TXT_EDIT_SEQUENCE_MASS}
                                                 id={TXT_EDIT_SEQUENCE_MASS}
                                                 value={sequence.mass.toFixed(DECIMAL_PLACES)}/>
                                    : sequence.mass.toFixed(DECIMAL_PLACES)}</td>
                                <td onClick={() => this.edit(sequence.id, sequence.family, sequence.organism)}>{this.state.editable === sequence.id
                                    ? <Creatable className={styles.creatable} isMulti={true}
                                                 id={'cre-edit-sequence-family'} options={this.state.familyOptions}
                                                 value={this.state.editFamily} onChange={this.familyEditChange}/>
                                    : sequence.family}</td>
                                <td onClick={() => this.edit(sequence.id, sequence.family, sequence.organism)}>{this.state.editable === sequence.id
                                    ? <Creatable className={styles.creatable} isMulti={true}
                                                 id={'cre-edit-sequence-organism'} options={this.state.organismOptions}
                                                 value={this.state.editOrganism} onChange={this.organismEditChange}/>
                                    : sequence.organism}</td>
                                <td>{sequence.nModification}</td>
                                <td>{sequence.cModification}</td>
                                <td>{sequence.bModification}</td>
                                <td>{this.state.editable === sequence.id
                                    ? <div>
                                        <SelectInput id={SEL_EDIT_SEQUENCE_SOURCE} name={SEL_EDIT_SEQUENCE_SOURCE}
                                                     options={ServerEnumHelper.getOptions()}
                                                     selected={sequence.source?.toString()}/>
                                        <TextInput className={styles.filter} name={TXT_EDIT_SEQUENCE_IDENTIFIER}
                                                   id={TXT_EDIT_SEQUENCE_IDENTIFIER} value={sequence.identifier}/>
                                    </div>
                                    : sequence.identifier ?
                                        <a href={ServerEnumHelper.getLink(sequence.source, sequence.identifier)}
                                           target={'_blank'}
                                           rel={'noopener noreferrer'}>{ServerEnumHelper.getFullId(sequence.source, sequence.identifier)}</a> : ''}
                                </td>
                                <td>
                                    {this.state.editable === sequence.id ? <button className={styles.update}
                                                                                   onClick={() => this.update(sequence.id)}>Update</button> :
                                        <div/>}
                                    {this.state.editable === sequence.id ?
                                        <button className={styles.delete} onClick={this.editEnd}>Cancel</button> :
                                        <div/>}
                                    <button className={styles.update} onClick={() => this.detail(sequence.id)}>Detail
                                    </button>
                                    <button onClick={() => this.showLargeSmiles(sequence.smiles)}>Show</button>
                                    <button className={styles.create} onClick={() => this.clone(sequence.id)}>Clone
                                    </button>
                                    <button className={styles.delete}
                                            onClick={() => this.popup(sequence.id)}>Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </section>
            </section>
        )
    }

    create(values: any): void {
        /* Empty on purpose */
    }

    update(key: number): void {
        let token = localStorage.getItem(TOKEN);
        if (token) {
            let name = document.getElementById(TXT_EDIT_SEQUENCE_NAME) as HTMLInputElement;
            let type = document.getElementById(TXT_EDIT_SEQUENCE_TYPE) as HTMLInputElement;
            let fomrula = document.getElementById(TXT_EDIT_SEQUENCE_FORMULA) as HTMLInputElement;
            let mass = document.getElementById(TXT_EDIT_SEQUENCE_MASS) as HTMLInputElement;
            let source = document.getElementById(SEL_EDIT_SEQUENCE_SOURCE) as HTMLSelectElement;
            let identifier = document.getElementById(TXT_EDIT_SEQUENCE_IDENTIFIER) as HTMLSelectElement;
            fetch(this.getEndpointWithId(key), {
                method: 'PATCH',
                headers: {'x-auth-token': token},
                body: JSON.stringify({
                    sequenceName: name.value,
                    sequenceType: type.value,
                    formula: fomrula.value,
                    mass: mass.value === '' ? null : mass.value,
                    source: source.value,
                    identifier: identifier.value,
                    family: this.state.editFamily.map((family: any) => family.value),
                    organism: this.state.editOrganism.map((org: any) => org.value)
                })
            }).then(response => {
                if (response.status === 204) {
                    this.flashRef.current!.activate(FlashType.OK, 'Sequence ' + this.findName(key) + ' updated');
                    this.list();
                } else {
                    response.json().then(data => {
                        this.flashRef.current!.activate(FlashType.BAD, data.message);
                    }).catch(() => this.flashRef.current!.activate(FlashType.BAD));
                }
            }).catch(() => this.flashRef.current!.activate(FlashType.BAD));
        } else {
            this.flashRef.current!.activate(FlashType.BAD, ERROR_LOGIN_NEEDED);
        }
        this.editEnd();
    }

}

export default SequencePage;
