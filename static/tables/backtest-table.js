import React from 'react';
import {AgGridReact} from 'ag-grid-react';
import {Button} from 'react-bootstrap';
import {actionBoxWidth, BacktestControl, renderLog, pad,
       process_headers} from '../../static/utils';

Date.prototype.Format = function (fmt) { //author: meizz
    var o = {
	"M+": this.getMonth() + 1, //月份
	"d+": this.getDate(), //日
	"h+": this.getHours(), //小时
	"m+": this.getMinutes(), //分
	"s+": this.getSeconds(), //秒
	"q+": Math.floor((this.getMonth() + 3) / 3), //季度
	"S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
	if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

export class BacktestTable extends React.Component {
    constructor(props) {
	super(props);
	this.state = {
	    columnDefs: [],
	    rowData: [],
	    idList: new Set(),
	    defaultData: {}
	};
	this.onGridReady = this.onGridReady.bind(this);
	this.addRow = this.addRow.bind(this);
	this.removeRow = this.removeRow.bind(this);
    }
    onGridReady(params) {
	this.api = params.api;
	this.columnApi = params.columnApi;
    }
    addRow() {
	var r = Object.assign({}, this.state.defaultData);
	var c = this.state.idList;
	var rows = this.state.rowData;
	var i = 0;
	var id = undefined;
	do {
	    i += 1;
	    id = r.strategy + "-backtest-" + pad(i, 5);
	} while (c.has(id));
	r.id = id;
	this.state.rowData.push(r);
	this.state.idList.add(id);
	this.api.setRowData(rows);
    }
    removeRow(props) {
	props.api.removeItems([props.node]);
	this.state.rowData.splice(props.rowIndex, 1);
	this.state.idList.delete(props.data.id);
	$.get("/backtest/remove-row/" + props.data.id);
    }
    componentWillReceiveProps(newprops) {
	var l = this;
	var d = new Date();
	// Get previous monday
	d.setDate(d.getDate() - (d.getDay() + 6) % 7);
	d.setHours(0);
	d.setMinutes(0);
	d.setSeconds(0);
	d.setMilliseconds(0);
	
	if (newprops.header != undefined) {
	    process_headers(l, [
		{headerName: "Id",
		 field: "id"},
		{headerName: "Instrument",
		 field: "dataname",
		 volatile: true,
		 editable: true,
		 defaultData: ''},
		{headerName: "Backtest file",
		 field: "tickersource",
		 volatile: true,
		 editable: true,
		 defaultData: 'ticker-%{instrument}.txt'},
		{headerName: "Plot",
		 field: "plot",
		 volatile: true,
		 editable: true,
		 cellEditor: "select",
		 cellEditorParams: {values: ['candle', 'none']},
		 defaultData: "candle"},
		{headerName: "Jitter",
		 field: "jitter",
		 volatile: true,
		 editable: true,
		 defaultData: 0}
	    ], [
		{headerName: "Initial cash",
		 field: "initial_cash",
		 volatile: true,
		 editable: true,
		 defaultData: 100000.0},
		{headerName: "Backtest Start",
		 field: "backtest_start_time",
		 volatile: true,
		 editable: true},
		{headerName: "Backtest End",
		 field: "backtest_end_time",
		 volatile: true,
		 editable: true},
		{headerName: "Backtest",
		 field: "backtest",
		 volatile: true,
		 width: actionBoxWidth,
		 cellRendererFramework: BacktestControl,
		 parent: l
		}], newprops.header, {
		    "strategy" : l.props.strategy,
		    "backtest_start_time": d.Format("yyyy-MM-dd hh:mm:ss")
		});
	}
	if (newprops.data != undefined) {
	    var d = newprops.data;
	    var idList = new Set();
	    for(var i=0; i < d.length; i++) {
		idList.add(d[i].id);
	    }
	    l.setState({rowData: d,
			idList: idList});
	    l.api.setRowData(d);
	}
    }
    render() {
	return (
	    <div>
		<Button onClick={this.addRow}>New Backtest</Button>
	<AgGridReact
	    // column definitions and row data are immutable, the grid
	    // will update when these lists change
	    columnDefs={this.state.columnDefs}
	    rowData={this.state.rowData}
	    onGridReady={this.onGridReady}
		/></div>
	)
    }
}
