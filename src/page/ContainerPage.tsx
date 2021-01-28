import * as React from "react";
import "react-app-polyfill/ie11";
import styles from "../main.module.scss"
import {ENDPOINT, SELECTED_CONTAINER, TOKEN} from "../constant/ApiConstants";
import Flash from "../component/Flash";
import {Field, Form, Formik, FormikHelpers} from "formik";
import {SelectInput, SelectOption} from "../component/SelectInput";
import FlashType from "../component/FlashType";
import PopupYesNo from "../component/PopupYesNo";
import TextInput from "../component/TextInput";

interface Container {
    id: number,
    containerName: string,
    visibility: string,
    mode: string
}

interface FreeContainer {
    id: number,
    containerName: string,
    visibility: string
}

interface State {
    containers: Array<Container>;
    freeContainers: Array<FreeContainer>;
    selectedContainer?: number;
    editable?: number;
}

interface Values {
    containerName: string;
    visibility: string;
}

const visibilityOptions = [
    new SelectOption('PRIVATE'), new SelectOption('PUBLIC')
];

class ContainerPage extends React.Component<any, State> {

    flashRef: React.RefObject<Flash>;
    popupRef: React.RefObject<PopupYesNo>;

    constructor(props: any) {
        super(props);

        this.flashRef = React.createRef();
        this.popupRef = React.createRef();
        this.popup = this.popup.bind(this);
        this.delete = this.delete.bind(this);
        this.edit = this.edit.bind(this);
        this.editEnd = this.editEnd.bind(this);
        this.update = this.update.bind(this);

        let selectedContainer = localStorage.getItem(SELECTED_CONTAINER);
        if (selectedContainer) {
            this.state = {containers: [], freeContainers: [], selectedContainer: parseInt(selectedContainer)};
        } else {
            this.state = {containers: [], freeContainers: []};
        }
    }

    componentDidMount(): void {
        this.containers();
        this.freeContainers();
    }

    popup(key: number) {
        this.popupRef.current!.key = key;
        this.popupRef.current!.activate();
    }

    containers() {
        const token = localStorage.getItem(TOKEN);
        if (token) {
            fetch(ENDPOINT + 'container', {
                method: 'GET',
                headers: {'x-auth-token': token}
            })
                .then(response => {
                    if (response.status === 401) {
                        localStorage.removeItem(TOKEN);
                    }
                    return response;
                })
                .then(response => response.status === 200 ? response.json() : [])
                .then(response => this.setState({containers: response}));
        }
    }

    freeContainers() {
        fetch(ENDPOINT + 'free/container', {
            method: 'GET'
        })
            .then(response => response.json())
            .then(response => this.setState({freeContainers: response}));
    }

    selectContainer(containerId: number) {
        this.setState({selectedContainer: containerId});
        localStorage.setItem(SELECTED_CONTAINER, containerId.toString());
    }

    containerCreate(values: Values) {
        const token = localStorage.getItem(TOKEN);
        if (token) {
            fetch(ENDPOINT + 'container', {
                method: 'POST',
                headers: {'x-auth-token': token, 'Content-Type': 'application/json'},
                body: JSON.stringify({containerName: values.containerName, visibility: values.visibility})
            }).then(response => {
                if (response.status === 201) {
                    this.flashRef.current!.activate(FlashType.OK);
                    this.containers();
                    this.freeContainers();
                } else {
                    response.json().then(data => {
                        this.flashRef.current!.activate(FlashType.BAD, data.message);
                    });
                }
            });
        } else {
            this.flashRef.current!.activate(FlashType.BAD, 'You need to login');
        }
    }

    delete(key: string) {
        let token = localStorage.getItem(TOKEN);
        if (token) {
            fetch(ENDPOINT + 'container/' + key, {
                method: 'DELETE',
                headers: {'x-auth-token': token},
            }).then(response => {
                if (response.status !== 204) {
                    response.json().then(data => {
                        this.flashRef.current!.activate(FlashType.BAD, data.message);
                    });
                } else {
                    this.flashRef.current!.activate(FlashType.OK);
                    this.containers();
                    this.freeContainers();
                }
            })
        } else {
            this.flashRef.current!.activate(FlashType.BAD, 'You need to login');
        }
    }

    edit(containerId: number) {
        this.setState({editable: containerId});
    }

    editEnd() {
        this.setState({editable: undefined});
    }

    update(containerId: number) {
        let token = localStorage.getItem(TOKEN);
        if (token) {
            let name = document.getElementById('txt-edit-containerName') as HTMLInputElement;
            let visibility = document.getElementById('sel-edit-visibility') as HTMLSelectElement;

            fetch(ENDPOINT + 'container/' + containerId, {
                method: 'PUT',
                headers: {'x-auth-token': token},
                body: JSON.stringify({containerName: name.value, visibility: visibility.value})
            }).then(response => {
                if (response.status === 204) {
                    this.flashRef.current!.activate(FlashType.OK, 'Updated');
                } else {
                    response.json().then(data => {
                        this.flashRef.current!.activate(FlashType.BAD, data.message);
                    });
                }
            });
            this.editEnd();
            this.containers();
            this.freeContainers();
        } else {
            this.flashRef.current!.activate(FlashType.BAD, 'You\'re not logged');
        }
    }

    render() {
        return (
            <section className={styles.page}>
                <section className={styles.pageTable}>
                    <h1>Container</h1>
                    <PopupYesNo label={"Realy want to delete container?"} onYes={this.delete} ref={this.popupRef}/>
                    <Flash textBad='Failure!' textOk='Success!' ref={this.flashRef}/>

                    {localStorage.getItem(TOKEN) !== null ?
                        <div><h2>Create new container</h2>

                            <Formik
                                initialValues={{
                                    containerName: '',
                                    visibility: 'PRIVATE'
                                }}
                                onSubmit={(
                                    values: Values,
                                    {setSubmitting}: FormikHelpers<Values>
                                ) => {
                                    setTimeout(() => {
                                        this.containerCreate(values);
                                        setSubmitting(false);
                                    }, 500);
                                }}
                            >
                                <Form id="containerCreate">
                                    <label htmlFor="containerName">Container name:</label>
                                    <Field id="containerName" name="containerName"
                                           placeholder='Your new Container Name'/>

                                    <label htmlFor="visibility">Container visibility:</label>
                                    <SelectInput id="visibility" name="visibility" options={visibilityOptions}/>

                                    <button type="submit" className={styles.create}>Create new container</button>
                                </Form>
                            </Formik>
                        </div> : <div/>
                    }

                    <h2>Your containers</h2>

                    <table>
                        <thead>
                        <tr>
                            <th>Id</th>
                            <th>Container name</th>
                            <th>Visibility</th>
                            <th>Mode</th>
                            <th>Is selected</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {this.state.containers.map(container => (
                            <tr key={container.id}>
                                <td>{container.id}</td>
                                <td onClick={() => this.edit(container.id)}>{this.state.editable === container.id ?
                                    <TextInput value={container.containerName} name='txt-edit-containerName' id='txt-edit-containerName'/>: container.containerName}</td>
                                <td onClick={() => this.edit(container.id)}>{this.state.editable === container.id ?
                                    <SelectInput id='sel-edit-visibility' name='sel-edit-visibility'
                                                 options={visibilityOptions}/> : container.visibility}</td>
                                <td>{container.mode}</td>
                                <td>{container.id === this.state.selectedContainer ? 'Yes' : 'No'}</td>
                                <td>

                                    {this.state.editable === container.id ? <button className={styles.update} onClick={() => this.update(container.id)}>Update</button> : <div/>}
                                    {this.state.editable === container.id ? <button className={styles.delete} onClick={this.editEnd}>Cancel</button> : <div/>}
                                    <button onClick={() => this.selectContainer(container.id)}>Select</button>
                                    <button
                                        onClick={() => window.location.href = '/container/' + container.id}>Collaborators
                                    </button>
                                    <button>Clone</button>
                                    <button>Export</button>
                                    <button className={styles.delete} onClick={() => this.popup(container.id)}>Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>

                    <h2>Public containers</h2>

                    <table>
                        <thead>
                        <tr>
                            <th>Id</th>
                            <th>Container name</th>
                            <th>Is selected</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {this.state.freeContainers.map(container => (
                            <tr key={container.id}>
                                <td>{container.id}</td>
                                <td>{container.containerName}</td>
                                <td>{container.id.toString() === localStorage.getItem(SELECTED_CONTAINER) ? 'Yes' : 'No'}</td>
                                <td>
                                    <button onClick={() => this.selectContainer(container.id)}>Select</button>
                                    <button>Clone</button>
                                    <button>Export</button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>

                </section>
            </section>
        )
    }

}

export default ContainerPage;
