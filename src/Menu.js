/* jshint esversion: 6 */
import React, { Component } from 'react';
import dialogPolyfill from 'dialog-polyfill';
import { findDOMNode } from 'react-dom';
import { DataTable, TableHeader, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, Textfield, Card, CardTitle, CardText } from 'react-mdl';
import {database} from "./App";
import './Menu.css';

export default class Menu extends Component {
    constructor(props) {
        super(props);
        this.state = {
            menuData: [],
            menuUnavailableData: [],
            editingId: null,
            removingId: null,
            openEditDialog: false,
            openRemoveDialog: false,
            dialogTitle: '',
            dialogState: null,
            itemName: '',
            itemPrice: '',
            itemNameError: null,
            itemPriceError: null,
        };
    }    

    getMenu(stallId) {
        database.ref('menu/' + stallId).on('value', data => {
                let menu = [];
                let menuUnavailable = [];
                data.forEach(item => {
                    const itemData = item.val();
                    if (itemData.deleted !== true) {
                        if (itemData.unavailable === true) {
                            menuUnavailable.push({
                                item: itemData.name,
                                id: item.key
                            });
                        } else {
                            menu.push({
                                item: itemData.name,
                                price: itemData.price,
                                id: item.key
                            });
                        }
                    }
                });
                this.setState({
                    menuData: menu,
                    menuUnavailableData: menuUnavailable
                });
            });
    }

    componentWillMount() {
        this.getMenu(this.props.stallId);
    }

    componentDidMount() {
        dialogPolyfill.registerDialog(findDOMNode(this.refs.editDialog));
        dialogPolyfill.registerDialog(findDOMNode(this.refs.removeDialog));
    }

    handleCloseDialog() {
        this.setState({
            openEditDialog: false,
            openRemoveDialog: false,
        });
    }

    removeItem(id) {
        this.setState({
            openRemoveDialog: true,
            removingId: id,
        });
    }

    editItem(id) {
        database.ref('menu/' + this.props.stallId + '/' + id).once('value')
            .then(data => {
                const item = data.val();
                this.setState({
                    openEditDialog: true,
                    dialogTitle: 'Edit ' +  item.name,
                    itemName: item.name,
                    itemPrice: (item.price/100).toFixed(2),
                    dialogState: 'edit',
                    editingId: id
                });
            });
    }

    markItemUnavailable(id) {
        database.ref('menu/' + this.props.stallId + '/' + id + '/unavailable').set(true);
    }

    markItemAvailable(id) {
        database.ref('menu/' + this.props.stallId + '/' + id + '/unavailable').set(false);
    }

    handleSaveDialog() {
        if (this.state.dialogState === 'edit') {
            database.ref('menu/' + this.props.stallId + '/' + this.state.editingId).set({
                name: this.refs.itemName.inputRef.value,
                price: parseFloat(this.refs.itemPrice.inputRef.value).toFixed(2)*100
            }).then(() => {
                this.setState({
                    openEditDialog: false,
                    editingId: null,
                    dialogState: null
                });
            });
        } else if (this.state.dialogState === 'add') {
            database.ref('menu/' + this.props.stallId).push({
                name: this.refs.itemName.inputRef.value,
                price: parseFloat(this.refs.itemPrice.inputRef.value).toFixed(2)*100
            }).then(() => {
                this.setState({
                    openEditDialog: false,
                    dialogState: null
                });
            });
        }
    }

    handleRemoveDialog() {
        database.ref('menu/' + this.props.stallId + '/' + this.state.removingId + '/deleted').set(true)
            .then(() => {
                this.setState({
                    removingId: null,
                    openRemoveDialog: false,
                });
            })
    }

    handleAddItem() {
        this.setState({
            openEditDialog: true,
            dialogTitle: 'Add item',
            itemName: '',
            itemPrice: '0.00',
            dialogState: 'add'
        });
    }

    render() {
        return (
            <div className="Menu">
                <Card shadow={0} style={{ width: "100%" }}>
                <CardTitle>Menu</CardTitle>
                    <CardText style={{ width: "100%" }}>    
                <DataTable
                    rows={this.state.menuData}
                    style={{width: '100%', color: '#000'}}
                >
                    <TableHeader name="item">Item</TableHeader>
                    <TableHeader numeric name="price" cellFormatter={price => `${(price / 100).toFixed(2)}`}>
                        Price</TableHeader>
                    <TableHeader numeric name="id" cellFormatter={id => 
                                <div>
                                    <IconButton name="edit" colored ripple onClick={this.editItem.bind(this, id)}/>
                                    <IconButton name="remove" colored ripple onClick={this.removeItem.bind(this, id)} />
                                    <Button ripple primary onClick={this.markItemUnavailable.bind(this, id)}>Mark unavailable</Button>
                                </div>}>Actions</TableHeader>
                        </DataTable>
                        <div style={{ textAlign: "center", marginTop: "10px" }}>        
                            <Button raised ripple colored onClick={this.handleAddItem.bind(this)}>Add item</Button>
                        </div>    
                    </CardText>
                </Card>  
                <Card shadow={0} style={{ width: "100%", marginTop: "10px"}}>
                <CardTitle>Unavailable items</CardTitle>
                    <CardText style={{ width: "100%" }}>    
                <DataTable
                    rows={this.state.menuUnavailableData}
                    style={{width: '100%', color: '#000'}}
                >
                    <TableHeader name="item">Item</TableHeader>
                    <TableHeader numeric name="id" cellFormatter={id => 
                                <div>
                                    <Button ripple primary onClick={this.markItemAvailable.bind(this, id)}>Mark available</Button>
                                </div>}>Actions</TableHeader>
                        </DataTable>
                    </CardText>
                </Card>  
                <Dialog open={this.state.openEditDialog} ref="editDialog">
                    <DialogTitle>{this.state.dialogTitle}</DialogTitle>
                    <DialogContent>
                        <Textfield label="Item name" error={this.state.itemNameError} ref="itemName"
                        onChange={(event) => {this.setState({itemName: event.target.value})}} value={this.state.itemName}/>
                        <Textfield label="Price" error={this.state.itemPriceError} ref="itemPrice"
                        onChange={(event) => {this.setState({itemPrice: event.target.value})}} value={this.state.itemPrice}/>
                    </DialogContent>
                    <DialogActions>
                        <Button type='button' onClick={this.handleSaveDialog.bind(this)}>Save</Button>
                        <Button type='button' onClick={this.handleCloseDialog.bind(this)}>Cancel</Button>
                    </DialogActions>
                </Dialog>
                <Dialog open={this.state.openRemoveDialog} ref="removeDialog">
                    <DialogTitle>Really?</DialogTitle>
                    <DialogContent>
                        <p>Really remove? This can't be undone!</p>
                    </DialogContent>
                    <DialogActions>
                        <Button type='button' onClick={this.handleRemoveDialog.bind(this)}>Remove</Button>
                        <Button type='button' onClick={this.handleCloseDialog.bind(this)}>Cancel</Button>
                    </DialogActions>
                </Dialog>
            </div>
        );
    }
}
