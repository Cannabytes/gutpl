inputIdf = "";


$(document).on('click', '#autostart', function(e) {
	if($("#autostart").prop('checked')==true){
 		nSuccess("Автозапуск игры включен");
	}else{
		nError("Автозапуск игры отключен");
	}
});

//Нажатие на кнопку подтверждения выбора папки
$(document).on('click', '#dirOpenDialogApply', function(e) {
		path = $("#dialogFullPath").text();
		$("#"+inputIdf).val(path);
});

//Сохранение 
$(document).on('click', '#dirOpenDialogPathServerSave', function(e) {
		path = $("#getClientPath").val();
		if (path == "") {
			nError("Введите путь к папке игры");
			return;
		}
		$("#"+inputIdf).val(path);
		chronicle = $(this).data( "chronicle" );
		serverid = $(this).data( "serverid" );
		console.log(path, chronicle, serverid);
		$.ajax({
			url: 'http://127.0.0.1:'+launcherPort+'/open/dialog/select/save',
				xhrFields: {
				withCredentials: false
			},
			method: 'post',        
			data: {chronicle:chronicle, path:path, serverid:serverid },
			dataType: 'json',
			crossDomain: true,
			contentType: 'application/x-www-form-urlencoded',
			processData: true,
			success: function(data){ 
				$("#"+$(this).data("input")).val(data.path);
				loadBlockHTMLServerSelect(serverid, $(this), "select/block");
				// $("#l2exe").hide();
				// document.getElementById('l2exe').style.display = 'none';
			}
		});
});


//Сохранение от анонимного сервера
$(document).on('click', '#dirOpenDialogPathServerLauncherSave', function(e) {
		path = $("#dialogFullPath").text();
		$("#"+inputIdf).val(path);
		chronicle = $(this).data( "chronicle" );
		$.ajax({
			url: 'http://127.0.0.1:'+launcherPort+'/open/dialog/select/save',
				xhrFields: {
				withCredentials: false
			},
			method: 'post',        
			data: {chronicle:chronicle, path:path},
			dataType: 'json',
			crossDomain: true,
			contentType: 'application/x-www-form-urlencoded',
			processData: true,
			success: function(data){ 
				$("#"+$(this).data("input")).val(data.path);
				loadBlockHTMLServerSelectAnon($(this), "select/block/anon");
			}
		});
});

function loadBlockHTMLServerSelectAnon(elementid, linkblock){
	$.ajax({
		url: 'http://127.0.0.1:'+launcherPort+'/html/load/'+linkblock,
		  xhrFields: {
			withCredentials: false
		},
		method: 'post',           
		data: {},
		dataType: 'html',
		crossDomain: true,
		contentType: 'application/x-www-form-urlencoded',
		processData: true,
		success: function(data){
			$("#serverSelect").html(data);
 		}
	});
}


//Нажатие на кнопку открыть диалог
$(document).on('click', '.showDialog', function(e) {
 	$("#dialogFullPath").empty();
	inputIdf = $(this).data("input");
	$( "#dirOpenDialogApply" ).data( "input", inputIdf );
	path = $(this).data("path");
	if($("#dialogFullPath").text()==""){
		$("#dirOpenDialogBack").hide();
	}
	openDialogModal(path);
});

//Нажатие на кнопку открыть диалог
$(document).on('click', '.selectDir', function(e) {
 	$("#dialogFullPath").empty();
	path = $(this).data("path");
	openDialogModal(path);
});

//Кликаем по списку папок
$(document).on("click", ".dirOpenDialogList", function (e) {  
 	path = $(this).data("path");  
	openDialogModal(path);
});

$(document).on("click", "#dirOpenDialogBack", function (e) {
	path = $("#dialogFullPath").text();
	backdir = function (dir) {
	path = dir.substring(0, dir.lastIndexOf("\\"));
		 if (path.charAt(path.length - 1) == ":"){
			 $("#dialogFullPath").empty();
			 return ""
		 }
	return  path
	}
	openDialogModal(backdir(path));
});

function openDialogModal(path){
	  	$.ajax({
		url: 'http://127.0.0.1:'+launcherPort+'/open/dialog/select',
		  xhrFields: {
			withCredentials: false
		},
		method: 'post',           
		data: {path:path},
		dataType: 'json',
		crossDomain: true,
		contentType: 'application/x-www-form-urlencoded',
		processData: true,
		success: function(data){
			$("#dialogFullPath").text(data.path);
			if(data.files==null){
				$("#dirOpenDialogList").html(`<div class="col-md-8 col-lg-1 col-xl-8 ">Тут нет ни одной папки</div>`);
				return;
			}
			if($("#dialogFullPath").text()!=""){
				$("#dirOpenDialogBack").show();
			}else{
				$("#dirOpenDialogBack").hide();
			}
			$("#dirOpenDialogList").empty();
	
			$.each(data.files, function(i, item) {
 				$("#dirOpenDialogList").append(`
				<a href="javascript:void()" data-path="`+item.path+`" class="selectDir btn-social-text btn-github waves-effect waves-light m-1">
				<i class="fa fa-folder text-warning"></i> <span>`+item.name+`</span>
				</a>`);
			});

  		}
	});
}
 
