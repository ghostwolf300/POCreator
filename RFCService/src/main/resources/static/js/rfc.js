/**
 * 
 */

var $body;
var contextPath;


$(document).ready(initPage);
$(document).on({
	ajaxStart : function(){
		$body.addClass('loading');
	},
	ajaxStop : function(){
		$body.removeClass('loading');
	}
});

function _globalSetup(){
	$body=$('body');
	$.ajaxSetup({
        headers:
        { 
        	'Accept': 'application/json',
	        'Content-Type': 'application/json'
        }
    });
	contextPath=$('#contextPath').val();
}

function initPage(){
	console.log('initializing page');
	_globalSetup();
 	var viewId=$('meta[name="viewId"]').attr('content');
 	if(viewId==1){
 		MessageBar.init();
 		console.log('menu');
 	}
 	else if(viewId==2){
 		MessageBar.init();
 		PurchaseOrder.init();
 		console.log('po');
 	}
	
}

var MessageBar=(function(){
	
	var $messageBar;
	var errorClass='error';
	var successClass='success';
	
	function init(){
		$messageBar=$('#messages');
		$messageBar.removeClass(errorClass);
		$messageBar.removeClass(successClass);
		$messageBar.text('');
		$messageBar.hide();
	}
	
	function showSuccess(txt){
		$messageBar.show();
		$messageBar.text(txt);
		$messageBar.addClass(successClass);
		$messageBar.removeClass(errorClass);
	}
	
	function showError(txt){
		$messageBar.show();
		$messageBar.text(txt);
		$messageBar.addClass(errorClass);
		$messageBar.removeClass(successClass);
	}
	
	return{
		init : init,
		showSuccess : showSuccess,
		showError : showError
	}
	
})();

var PurchaseOrder=(function(){
	
	var $fileChooser;
	var $saveAll;
	var $add;
	var $login;
	var $testrun;
	
	function init(){
		$fileChooser=$('#btn_choose');
		$saveAll=$('#btn_save_all');
		$add=$('#btn_add');
		$login=$('#sap_login_do');
		$testrun=$('#chk_testrun_all');
		_bindEventHandlers();
	}
	
	function _bindEventHandlers(){
		$add.click(_addOrder);
		$saveAll.click(_saveAll);
		$login.click(_loginSap);
		$fileChooser.change(_importFile);
		$testrun.change(_setTestRunAll);
		$('input.chk_testrun').change(_setTestRunSingle);
	}
	
	function _loginSap(){
		
		var userJson={
				'client' 	: $('#sap_client').val(),
				'userName'	: $('#sap_username').val(),
				'password'	: $('#sap_password').val()
		}
		
		var url=contextPath+'sap/login';
		var data=JSON.stringify(userJson);
		console.log(data);
		
		$.ajax({
			url : url,
			method : "POST",
			data : data,
			dataType : "json"
		}).done(function(user){
			console.log("Logged in");
			MessageBar.showSuccess("Logged in");
			$('#sap_user').text(user.userName+" "+user.client);
		}).fail(function(error){
			console.log(error);
			MessageBar.showError(error.status+": "+error.responseText);
		}).always(function(){
			$('#sap_login_modal').modal('hide');
		});
		
		
	}
	
	function _importFile(){
		var file=$fileChooser[0].files[0]
		
		var reader=new FileReader();
		
		reader.onloadend=function(event){
			var arrayBuffer=reader.result;
			var options={type : 'array'};
			var workbook=XLSX.read(arrayBuffer,options);
			var sheetName=workbook.SheetNames;
			var sheet=workbook.Sheets[sheetName];
			var rowData=XLSX.utils.sheet_to_row_object_array(sheet);
			//var jsonData=JSON.stringify(rowData);
			_addOrders(rowData);
		}
		_clearOrders();
		reader.readAsArrayBuffer(file);
	}
	
	function _setTestRunAll(){
		var test=$testrun.is(':checked');
		$('div.order_controls').each(function(){
			$(this).find('input.chk_testrun').prop('checked',test);
		});
	}
	
	function _setTestRunSingle(){
		var test=true;
		$('div.order_controls').each(function(){
			if($(this).find('input.chk_testrun').is(':checked') == false){
				test=false;
				return false;
			}
		});
		$testrun.prop('checked',test);
		
	}
	
	function _clearOrders(){
		$('div#orders').empty();
	}
	
	function _addOrders(orderLines){
		var orderNum;
		orderLines.forEach(function(line){
			if(line.rowType=='H' && line.orderNum!=orderNum){
				console.log('Creating order: '+line.orderNum);
				orderNum=line.orderNum;
				_createOrderHeader(orderNum,line);
			}
			else if(line.rowType=='L' && line.orderNum==orderNum){
				console.log('Adding line for order '+orderNum);
				_createOrderItem(orderNum,line);
			}
			
		});
	}
	
	function _createOrderHeader(orderNum,header){
		var $orderDiv=$('div.order_template').clone(true);
		$orderDiv.removeClass('order_template');
		$orderDiv.addClass('order');
		$orderDiv.attr('data-line_number', orderNum);
		$orderDiv.find('input.btn_save_single').attr('onclick','PurchaseOrder.saveSingle('+orderNum+')');
		var $orderHeaderDiv=$orderDiv.find('div#order_header');
		
		$orderHeaderDiv.find('input#vendor').val(header.supplier);
		$orderHeaderDiv.find('input#order_type').val(header.orderType);
		$orderHeaderDiv.find('input#po_date').val(_getHtmlDate(header.poDate));
		$orderHeaderDiv.find('input#purch_org').val(header.purchOrg);
		$orderHeaderDiv.find('input#purch_group').val(header.purchGroup);
		$orderHeaderDiv.find('input#delivery_date').val(_getHtmlDate(header.deliveryDate));
		$orderHeaderDiv.find('input#plant').val(header.plant);
		$orderHeaderDiv.find('input#storage_loc').val(header.storageLoc);
		$orderHeaderDiv.find('input#your_reference').val(header.yourReference);
		$orderHeaderDiv.find('input#our_reference').val(header.ourReference);
		
		var $tbody=$orderDiv.find('table.order_items_table tbody');
		$tbody.empty();
		
		$orderDiv.appendTo('div#orders');
	}
	
	function _getHtmlDate(dateValue){
		var d=_convertExcelDateValue(dateValue);
		var day=("0" + d.getDate()).slice(-2);
		var month=("0" + (d.getMonth() + 1)).slice(-2);
		var dateString=d.getFullYear()+"-"+month+"-"+day
		console.log(dateString);
		return dateString;
		
	}
	
	function _convertExcelDateValue(dateValue){
		return new Date((dateValue - (25567 + 1))*86400*1000)
	}
	
	function _createOrderItem(orderNum,item){
		
		$orderDiv=$('div#orders').find("[data-line_number='"+orderNum+"']")
		$orderItemsTable=$orderDiv.find('table.order_items_table');
		$tbody=$orderItemsTable.find('tbody');
		var rowCount=$tbody.find('tr').length;
		var itemNo;
		if(rowCount==0){
			itemNo=10;
		}
		else{
			itemNo=rowCount*10+10;
		}
		$tbody.append(_getItemRow(item,itemNo));
		
	}
	
	function _getItemRow(item,itemNo){
		$tr=$('div.order_template').find('table.order_items_table tbody>tr').clone();
		$tr.find('input#item_no').val(itemNo);
		$tr.find('input#material').val(item.material);
		$tr.find('input#quantity').val(item.qty);
		$tr.find('input#tax_code').val(item.taxCode);
		$tr.find('textarea#item_text').text(item.text);
		return $tr;
	}
	
	function _addOrder(){
		var orderNum=_getLineNumber();
		$orderDiv=$('div.order_template').clone(true);
		$orderDiv.removeClass('order_template');
		$orderDiv.addClass('order');
		$orderDiv.attr('data-line_number', orderNum);
		$orderDiv.find('input.btn_save_single').attr('onclick','PurchaseOrder.saveSingle('+orderNum+')');
		$orderDiv.appendTo('div#orders');
	}
	
	function _getLineNumber(){
		var	a=0;
		var b=0;
		$('div#order').each(function(){
			a=Number($(this).data('line_number'));
			if(a>b){
				b=a;
			}
		});
		return b+1;
	}
	
	function _saveAll(){
		console.log('saving all...');
		var orderJson;
		$('div#order').each(function(){
			orderJson=_getOrderJSON($(this));
			_saveOrder(orderJson);
		});
			
	}
	
	function saveSingle(lineNum){
		console.log('Saving order '+lineNum);
		var $orderDiv=$('div#orders').find("[data-line_number='"+lineNum+"']")
		var orderJson=_getOrderJSON($orderDiv);
		_saveOrder(orderJson);
	}
	
	function _saveOrder(orderJson){
		var url=contextPath+'po/save';
		var data=JSON.stringify(orderJson);
		console.log(data);
		
		$.ajax({
			url : url,
			method : "POST",
			data : data,
			dataType : "json"
		}).done(function(response){
			console.log("PO saved");
			MessageBar.showSuccess("PO saved");
			_handleResponse(response);
		}).fail(function(error){
			console.log(error);
			MessageBar.showError(error.status+": "+error.responseText);
		}).always(function(){
			
		});
	}
	
	function _fillSavedData(po){
		$orderDiv=$('div#orders').find("[data-line_number='"+po.metaData+"']")
		$orderDiv.find('div#order_header').find('input#document_number').val(po.id);
	}
	
	function _handleResponse(response){
		var $orderDiv=$('div#orders').find("[data-line_number='"+response.metaData+"']")
		var $messageDiv=$orderDiv.find('div.bapi_messages');
		var $tbody=$messageDiv.find('tbody');
		
		$messageDiv.show();
		$tbody.empty();
		response.lines.forEach(function(line,index){
			$tbody.append(_createResponseMessageRow(line));
		});
		
		if(response.poNumber!=-1){
			$orderDiv.find('div#order_header').find('input#document_number').val(response.poNumber);
		}
	}
	
	function _createResponseMessageRow(line){
		var $row=$('<tr>'+
				"<td class='message_type'>"+line.type+'</td>'+
				'<td>'+line.number+'</td>'+
				'<td>'+line.id+'</td>'+
				'<td>'+line.row+'</td>'+
				'<td>'+line.message+'</td>'+
				'</tr>');
		if(line.type == 'W'){
			$row.addClass('warning');
		}
		else if(line.type == 'I'){
			$row.addClass('info');
		}
		else if(line.type == 'E'){
			$row.addClass('error');
		}
		else if(line.type == 'S'){
			$row.addClass('success');
		}
		return $row;
	}
	
	function _getOrderJSON($orderDiv){
		var $orderHeaderDiv=$orderDiv.find('div#order_header');
		var $orderItemsDiv=$orderDiv.find('div#order_items');
		
		var lineNumber=$orderDiv.attr('data-line_number');
		
		var orderJson={
				'id'				: 	Number($orderHeaderDiv.find('input#document_number').val()),
				'companyCode'		:	'07',
				'documentType'		:	$orderHeaderDiv.find('input#order_type').val(),
				'purchasingOrg'		:	$orderHeaderDiv.find('input#purch_org').val(),
				'purchasingGroup'	:	$orderHeaderDiv.find('input#purch_group').val(),
				'documentDate'		:	$orderHeaderDiv.find('input#po_date').val(),
				'vendor'			:	$orderHeaderDiv.find('input#vendor').val(),
				'supplierPlant'		:	$orderHeaderDiv.find('input#plant').val(),
				'yourReference'		:	$orderHeaderDiv.find('input#your_reference').val(),
				'ourReference'		:	$orderHeaderDiv.find('input#our_reference').val(),
				'lineItems'			:	_getOrderLineItems(
											$orderItemsDiv,
											Number($orderHeaderDiv.find('input#document_number').val()),
											$orderHeaderDiv.find('input#plant').val(),
											$orderHeaderDiv.find('input#storage_loc').val()
										),
				'metaData'			:	lineNumber,
				'test'				:	$orderDiv.find('input.chk_testrun').is(':checked')
		}
		
		return orderJson;

	}
	
	function _getOrderLineItems($orderItemsDiv, po, plant, storageLoc){
		var itemsArr=[];
		var lineItemJson;
		
		$tbody=$orderItemsDiv.find('table#order_items_table').find('tbody');
		
		$tbody.find('tr').each(function(){
			var itemNo=Number($(this).find('input#item_no').val());
			lineItemJson={
					'poId'				:	po,
					'item'				:	itemNo,
					'material'			:	$(this).find('input#material').val(),
					'plant'				:	plant,
					'storageLocation'	:	storageLoc,
					'quantity'			:	Number($(this).find('input#quantity').val()),
					'valuationType'		:	'',
					'taxCode'			:	$(this).find('input#tax_code').val(),
					'textLines'			: _getItemTextLines(po,itemNo,$(this).find('textarea#item_text'))
			}
			itemsArr.push(lineItemJson);
		});
			
		return itemsArr;
		
	}
	
	function _getItemTextLines(po,itemNo,$itemText){
		var lines=$itemText.val().split('\n');
		var textArr=[];
		var textLineJson;
		
		for(var i=0;i<lines.length;i++){
			textLineJson={
					'poId'		: po,
					'item'		: itemNo,
					'textId'	: 'F02',
					'textForm'  : '*',
					'textLine'	: lines[i]
			}
			textArr.push(textLineJson);
		}
		
		return textArr;
	}
	
	return{
		init : init,
		saveSingle : saveSingle
	}
	
})();