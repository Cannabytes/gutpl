reinit();

function reinit(){
	 $('#default-datatable').DataTable( {
		    "order": [  3, 'DESC' ]
	 }); 
}

	$(window).on('popstate', function (event) {
        if (history.state != null && history.state.sitesearch != null) {
            var params = parseParams(window.location.search);
            prepareSearch(params['s'], params['page'], false);
        } else {
			var href = window.location.href; 
			load(href);
            window.scrollTo(0, 0);
        }
    });

    function addActiveMenu(element, current) {
          $('.nav-item').removeClass('active');
          $('.nav-link').removeClass('active');
          element.parents('.nav-item').last().addClass('active');
          if (element.parents('.sub-menu').length) {
            element.closest('.collapse').addClass('show');
            element.addClass('active');
          }
          if (element.parents('.submenu-item').length) {
            element.addClass('active');
          }
      }

	$(document).on('click', '.aj', function(e) {
		e.preventDefault();
		var href = $(this).prop('href');
		if(window.location.href == href){
			return;
		}
		addActiveMenu($(this), href)
		load(href);
    });

    function load(href){
		$.ajax({
            type: "POST",
            url: href,
            success: function (data) {
				
				  $('#dateStart').datepicker({
					 autoclose: true,
					 todayHighlight: true
				  });
				  
				console.log("AJAX->", href);
                $(".container-fluid").html(data);
				reinit();
 				window.history.pushState("object or string", "Title", href);
				config();
				info();
            }
        }); 
    }




var activePage = true;
var timeoutRequest = 560;
/*
	Порт лаунчера
*/
var launcherPort = 12550;

/*
	Статус лаунчера
	В процессе работы лаунчера, статус будет меняться и принимать значения ниже.
	0 - Ничего не происходит
	1 - Идет обновление патча
	2 - Идет обновление клиента
	3 - Пауза обновления патча
	4 - Пауза обновления клиента
	5 - Обновление патча завершено (ничего не происходит)
	6 - Обновление клиента завершено (ничего не происходит)
	7 - Произошла ошибка
	8 - Проверка соответствия файлов
	9 - Загрузка отменена
 */
 
var Status = 0;
//Последнее сообщения события
var LastMsg = "";
//Кол-во файлов которые необходимо обновить
var CountFiles = -1;
//Кол-во обновленных файлов
var CountFilesUploaded = -1;
//Общий размер файлов в виде строки с отображением величины размера (KB/MB/GB...)
var FullSizeFileStr = "";
//Общий вес файлов (в байтах) которые необходимо скачать
var FullSizeFiles = -1;
//Сколько скачено (в байтах)
var SizeFilesUploaded = -1;
//Сколько скачено с отображением размера (KB/MB/GB...)
var SizeFilesUploadedStr = "";
//Сколько осталось скачать (в байтах)
var SizeRemainsDownload = -1;
//Сколько осталось скачать с отображением размера (KB/MB/GB...)
var SizeRemainsDownloadStr = "";

//Вес файла (в байтах) который в данный момент скачивается 
var GetInfoDownloadFile = 0;
//Вес файла (в байтах) который в данный момент скачивается (KB/MB/GB...) 
var GetInfoDownloadFileStr = "";
//Кол-во файлов которые необходимо будет обновить
var CountFilesDBUpdate = 0;

//Массив файлов, которые в данный момент загружаются
var GetDownloads;


config();

// Делаем запрос к лаунчеру, чтоб знать статус, да и вообще что происходит
info();

if(Status == 1 || Status == 2){
	info();
}

/*
	Когда пользователь нажимает на элемент с id=GU_patch
*/
$(document).on("click", "#GU_patch",  function () {
	var data = start();
	info();
});

/*
	updateDBname - сюда передаем название базы
	Чтоб выключить загрузку, просто отпарвляем запрос на обновление (во время загрузки)
*/
function start() {
	serverID = window.location.pathname.split('/server/')[1];
	getClientPath = $("#getClientPath").val();
	$.ajax({
		url: 'http://127.0.0.1:'+launcherPort+'/download',
		  xhrFields: {
			withCredentials: false
		},
		method: 'post',           
		data: {getClientPath:getClientPath, serverID: serverID},
		dataType: 'json',
		crossDomain: true,
		contentType: 'application/x-www-form-urlencoded',
		processData: true,
		success: function(data){
			$("#favoriteMenu").show();
			if(data.ServerID==0){
				$("#favoriteMenu").data("href", "/launcher");
			}else{
				$("#favoriteMenu").html('<i class="zmdi zmdi-dot-circle-alt"></i> ' + data.Domain);
				$("#favoriteMenu").attr("href", "/server/"+data.ServerID);
			}
			return data;
		}
	});
}

//Если нужно получить конфиги, которые сейчас в GU
function config() {
	$.ajax({
		url: 'http://127.0.0.1:'+launcherPort+'/get/config',
		xhrFields: {
			withCredentials: false
		},
		method: 'post',           
		dataType: 'json',
		crossDomain: true,
		contentType: 'application/x-www-form-urlencoded',
		processData: true,
		success: function(config){
			console.log(config);
			if(config.ServerID==-1){
				$("#favoriteMenu").hide();
			}else{
				$("#favoriteMenu").show();
				$("#favoriteMenu").html('<i class="zmdi zmdi-dot-circle-alt"></i> ' + config.Domain);
				$("#favoriteMenu").attr("href", "/server/"+config.ServerID);
			}
			const hostname = new URL(window.location.href).hostname;
			 if(config.Domain == hostname){
				$("#GU_connector").remove();
			}
			for ( var i = 1; i <= config.Streams; i++ ) {
				 $("#GU_tableLoads").append(`<div class="progress-wrapper mb-4">
												<div><nobr id="GU_progress_file_id-${i}">Нет загрузки</nobr><span class="float-right" id="GU_files_update_percent-${i}">0%</span></div>
												<div class="progress" style="height:7px;">
													<div id="GU_progress_bar_id-${i}" class="progress-bar gradient-ibiza" style="width:0%"></div>
												</div>
											</div>`); 
 			};
			return config;
		}
	});
}


function info() { 
	var timerRequest = setInterval(
		function(){
			if(activePage==false){
				return;
			}
			$.ajax({
				url: 'http://127.0.0.1:'+launcherPort+'/info',
				  xhrFields: {
					withCredentials: false
				},
				method: 'post',           
				dataType: 'json',
				crossDomain: true,
				contentType: 'application/x-www-form-urlencoded',
				processData: true,
				error: function(xhr, status, error) {
					$("#GU_patchEvent").html("<a href='https://god.dark-times.ru/GameUpdate.exe'>Скачайте и запустите аптейдер</a>");
					clearInterval(timerRequest);
				},
				success: function(data){ 
					Status = data.Status;
					ProcentLoad = data.ProcentLoad;
					LastMsg = data.LastMsg;
					CountFiles = data.CountFiles;
					CountFilesUploaded = data.CountFilesUploaded;
					FullSizeFileStr = data.FullSizeFileStr;
					FullSizeFiles = data.FullSizeFiles;
					SizeFilesUploaded = data.SizeFilesUploaded;
					SizeFilesUploadedStr = data.SizeFilesUploadedStr;
					SizeRemainsDownload = data.SizeRemainsDownload;
					SizeRemainsDownloadStr = data.SizeRemainsDownloadStr;
					GetInfoDownloadFile = data.GetInfoDownloadFile;
					CountFilesDBUpdate = data.CountFilesDBUpdate;
					GetDownloads = data.GetDownloads;
					
					console.log(GetDownloads);
					switch (Status) {
					  case 0:
							clearInterval(timerRequest);
						break;
						
					  case 1:
							$("#GU_patch").text("Отменить загрузку");
							$("#GU_patchEvent").text(data.LastMsg);
							if(data.CountFiles>0){
								$("#ProcentLoad").css('width',  ProcentLoad+'%');

								$("#getFilesUp").text(data.CountFilesUploaded+"/"+data.CountFiles);
								$("#CountFilesUploaded").text(data.CountFilesUploaded);
								$("#CountFiles").text(data.CountFiles);
								$("#getSizeDl").text(data.SizeRemainsDownloadStr +"/"+FullSizeFileStr);
								$("#Status").text(Status);
								
								$("#GU_patchEventAddLine").text("Осталось "+data.SizeRemainsDownloadStr);
								document.title = "Осталось "+data.SizeRemainsDownloadStr;

								$.each(GetDownloads, function( id, value ) {
								  $("#GU_progress_file_id-"+(id+1)).text(value.Path);
								  $("#GU_files_update_percent-"+(id+1)).text(value.DownloadPercent+"%");
								  $("#GU_progress_bar_id-"+(id+1)).css('width', value.DownloadPercent+'%');
								});
							}
						break;
						
					  case 5:
					  case 6:
							clearInterval(timerRequest);
							$("#GU_patch").text("Обновление завершено");
							document.title = "Обновление завершено";
							
							$("#CountFilesUploaded").text(data.CountFilesUploaded);
							$("#CountFiles").text(data.CountFiles);
							
							$.each(GetDownloads, function( id, value ) {
								  $("#GU_progress_file_id-"+(id+1)).text(value.Path);
								  $("#GU_files_update_percent-"+(id+1)).text(value.DownloadPercent+"%");
								  $("#GU_progress_bar_id-"+(id+1)).css('width', value.DownloadPercent+'%');
							});

							$("#GU_patchEvent").text(data.LastMsg);

						break;
						
					  case 7:
					  case 9:
							clearInterval(timerRequest);
							$("#GU_patch").text("Обновить патч");
							$("#GU_patchEvent").text(data.LastMsg);
						break;
						
					  case 8: //Произошла ошибка (к примеру, память диска закончилась)
							clearInterval(timerRequest);
							$("#GU_patchEvent").text("Ошибка обновления");
							document.title = "Ошибка обновления";
 							$("#GU_patchEvent").append("<br>Error: "+data.LastMsg);
						break;
						
					}
 					console.log(data);
				}
			}) 
	}, timeoutRequest);
	
}


$(document).on("click", "#l2exe",  function () {
	var exe = $(this).data("exe");
	var args = $(this).data("args");
 	l2exe(exe, args);
});
/*
	Для запуска игры
	Специально сделано что после обновления можно добавить кнопку запуска игры
	В аргумент сюда передаем адрес к запуску клиента, к примеру system/L2.bin
	второй параметр другие аргументы к запуску
	Обратите внимание, что регистр имеет значение!
*/
function l2exe(exe, args){
	$.ajax({
		url: 'http://127.0.0.1:'+launcherPort+'/game/start',
		  xhrFields: {
			withCredentials: false
		},
		method: 'post',           
		data: {exe: exe, args: args},
		dataType: 'json',
		crossDomain: true,
		contentType: 'application/x-www-form-urlencoded',
		processData: true,
		success: function(data){
			return data;
		}
	});
}



$(document).on("#cmd", "click", function () {
	var command = $(this).data("command");
 	cmd(command);
});

/*
	Иногда пользователю нужно к примеру обновить DNS, а может ещё что-то сделать в командной строке
	Эта функция для этого, передаем строку запроса в аргумент.
	К примеру
	netsh winsock reset netsh int ip reset all netsh winhttp reset proxy ipconfig /flushdns
*/
function cmd(command){
	$.ajax({
		url: 'http://127.0.0.1:'+launcherPort+'/cmd',
		  xhrFields: {
			withCredentials: false
		},
		method: 'post',           
		data: {command: command},
		dataType: 'json',
		crossDomain: true,
		contentType: 'application/x-www-form-urlencoded',
		processData: true,
		success: function(data){ 
			return data;
		}
	});
}


//пользователь на вкладке сайте
window.onfocus = function(){ 
	timeoutRequest = 800;
	activePage = true;
}

//пользователь закрыл вкладку или переключил на другую
window.onblur = function(){ 
	// activePage = false;
	timeoutRequest = 1500;
}

$(document).on( 'click', '.openDialog', function(e){
 	openDialog($(this));

});

//Открыть патч пути
function openDialog(elementid){
		chronicle = elementid.data( "chronicle" );
		$.ajax({
		url: 'http://127.0.0.1:'+launcherPort+'/open/dialog',
		  xhrFields: {
			withCredentials: false
		},
		method: 'post',        
		data: {chronicle:chronicle},
		dataType: 'json',
		crossDomain: true,
		contentType: 'application/x-www-form-urlencoded',
		processData: true,
		success: function(data){ 
			$("#"+elementid.data("input")).val(data.path);
		}
	});
};

//Открыть патч пути
//ДЕПРИКЕЙТЕД
$(document).on( 'click', '#getClientButtonSelectDir', function(e){
		chronicle = $(this).data( "chronicle" );
		serverid = $(this).data( "serverid" );
		$.ajax({
		url: 'http://127.0.0.1:'+launcherPort+'/open/dialog',
		  xhrFields: {
			withCredentials: false
		},
		method: 'post',        
		data: {chronicle:chronicle},
		dataType: 'json',
		crossDomain: true,
		contentType: 'application/x-www-form-urlencoded',
		processData: true,
		success: function(data){ 
			$("#"+$(this).data("input")).val(data.path);
			loadBlockHTMLServerSelect(serverid, $(this), "select/block");
		}
	});
});

$(document).on( 'click', '#savePathClient', function(e){

 	version = $("#clientVersion").val();
	name = $("#clientname").val();
	path = $("#clientSetPath").val();
	
  	$.ajax({
		url: 'http://127.0.0.1:'+launcherPort+'/setting/games/set/save',
		  xhrFields: {
			withCredentials: false
		},
		method: 'post',           
		data: {version:version, name:name, path:path},
		dataType: 'json',
		crossDomain: true,
		contentType: 'application/x-www-form-urlencoded',
		processData: true,
		success: function(data){
			if (data.error!=null){
				nError(data.error);
			}else{
				$("#clientsPathList").empty();
				$.each(data.AllWays, function( id, way ) {
					console.log(way);
					$('#clientsPathList').before('<tr>\
                    <td>\
					<span class="badge badge-danger removeClient" data-id="'+way.ID+'"><i class="fa fa-remove"></i></span> '+way.Title+'</td>\
                    <td>'+way.Name+'</td>\
                    <td>'+way.Path+'</td>\
                  </tr>');
				});
			}
			console.log(data);
			return data;
		}
	});
});


var timerRequestCrPath = null;
//Узнаем о создании патч листа
getCreatePathInfo();
$(document).on( 'click', '#createPatchServer', function(e){
        timerRequestCrPath = setInterval(getCreatePathInfo, 300);
		savedirclientpath = $("#savedirclientpath").val();
		savedirupdate = $("#savedirupdate").val();
		version = $("#version").val();
		chronicle = $("#chronicle").val();
		$.ajax({
		url: 'http://127.0.0.1:'+launcherPort+'/setting/patch/create/start',
		  xhrFields: {
			withCredentials: false
		},
		method: 'post',           
		data: {savedirclientpath:savedirclientpath, savedirupdate:savedirupdate, version:version, chronicle:chronicle},
		dataType: 'json',
		crossDomain: true,
		contentType: 'application/x-www-form-urlencoded',
		processData: true,
		success: function(data){

		}
	});
});


function getCreatePathInfo(){
	$.ajax({
				url: 'http://127.0.0.1:'+launcherPort+'/setting/patch/create/start/get',
				  xhrFields: {
					withCredentials: false
				},
				method: 'post',           
				dataType: 'json',
				crossDomain: true,
				contentType: 'application/x-www-form-urlencoded',
				processData: true,
				success: function(data){
					status = data.status;
					allSize = data.allSize;
					countFiles = data.countFiles;
					countCreateFiles = data.countCreateFiles;
					timeWork = data.timeWork;
					if(status == 0){
						status = "Ожидание";
					}
					if(status == 1){
						status = "Архивация";
					}
					if(status == 2){
						status = "Завершено";
						clearInterval(timerRequestCrPath);
					}
					$("#filesCreateData").text(countCreateFiles + " / " + countFiles);
					$("#filesCreateDataSize").text(allSize);
					$("#filesCreateDataTime").text(timeWork);
					$("#filesCreateDataStatus").text(status);
					
			}
	});
}
	

function loadBlockHTMLServerSelect(serverID, elementid, linkblock){
  	$.ajax({
		url: 'http://127.0.0.1:'+launcherPort+'/html/load/'+linkblock,
		  xhrFields: {
			withCredentials: false
		},
		method: 'post',           
		data: {serverID:serverID},
		dataType: 'html',
		crossDomain: true,
		contentType: 'application/x-www-form-urlencoded',
		processData: true,
		success: function(data){
			$("#serverSelect").html(data);
 		}
	});
} 

/**
	Сохранение настроек
**/
$(document).on("change", ".gu_settings", function(){
	if ($(this).prop("type")=="checkbox"){
		settingName = $(this).data("sname");
		settingValue = $(this).is(":checked");
	}else{
		settingName = $(this).data("sname");
		settingValue = $(this).val();
	}
	  	$.ajax({
		url: 'http://127.0.0.1:'+launcherPort+'/settings/save',
		  xhrFields: {
			withCredentials: false
		},
		method: 'post',           
		data: {settingName:settingName, settingValue:settingValue},
		dataType: 'html',
		crossDomain: true,
		contentType: 'application/x-www-form-urlencoded',
		processData: true,
		success: function(data){
			console.log(data);
 		}
	});
});


$(document).on("click", "#saveInputPathSetting", function(){
		settingName = "pathSetting";
		settingValue = $("#savePathSetting").val();
		console.log("-1", settingName, "-2", settingValue);
  		$.ajax({
		url: 'http://127.0.0.1:'+launcherPort+'/settings/save',
		  xhrFields: {
			withCredentials: false
		},
		method: 'post',           
		data: {settingName:settingName, settingValue:settingValue},
		dataType: 'json',
		crossDomain: true,
		contentType: 'application/x-www-form-urlencoded',
		processData: true,
		success: function(data){
 		}
	});
});



$(document).on("click", "#addblockfile", function(){

	filename = $("#filename").val();
	chronicle = $("#chronicle").val();

  	$.ajax({
	url: 'http://127.0.0.1:'+launcherPort+'/setting/block/add',
	  xhrFields: {
		withCredentials: false
	},
	method: 'post',           
	data: {filename:filename, chronicle:chronicle},
	dataType: 'html',
	crossDomain: true,
	contentType: 'application/x-www-form-urlencoded',
	processData: true,
	success: function(data){
		console.log(data);
    }
  });
  
});


$(document).on("click", "#gu_patchCreateLink", function(){
 	  	$.ajax({
		url: 'http://127.0.0.1:'+launcherPort+'/setting/patch/create/link',
		  xhrFields: {
			withCredentials: false
		},
		method: 'post',           
		data: {
				Domain : $("#Domain").val(),
				Chronicle : $("#Chronicle").val(),
				PatchDBLink : $("#PatchDBLink").val(),
				FileArchivesLink : $("#FileArchivesLink").val(),
				
				EXP   : $("#Exp").val(),
				SP    : $("#SP").val(),
				Drop  : $("#Drop").val(),
				Adena : $("#Adena").val(),
				Spoil : $("#Spoil").val(),
				Quest : $("#Quest").val(),
				
				timeStart : $("#timeStart").val(),
				dateStart : $("#dateStart").val(),
				
				Style : $("#ServerVersion").val(),
				TimeZone : $("#TimeZone").val(),
				MaxEnchant : $("#MaxEnchant").val(),
				SafeEnchant : $("#SafeEnchant").val(),

 				gmshop : $("#gmshop").is(':checked'),
				buffer : $("#buffer").is(':checked'),
				globalGK : $("#globalGK").is(':checked'),
				offlineTrade : $("#offlineTrade").is(':checked'),
				soft : $("#soft").is(':checked'),
				macros : $("#macros").is(':checked'),
				ss : $("#ss").is(':checked'),
				newbiehelp : $("#newbiehelp").is(':checked')
				
				
			},
		dataType: 'json',
		crossDomain: true,
		contentType: 'application/x-www-form-urlencoded',
		processData: true,
		success: function(bcode){
			if(bcode["error"]){
				nError(bcode["error"]);
				return;
			}
			console.log(bcode);
			linkTest = `<a href=${bcode}>Game Update</a>`
			$('#gulink').text(linkTest);
			$("#gu_testlink").text("Тест вызова");
			$("#gu_testlink").attr('href', bcode.substring(1, bcode.length-1));
 		}
	});
});


//Удаление месторасположения клиента
$(document).on("click", ".removeClient", function(){
	self = $(this);
 	id = self.data("id");
  	$.ajax({
	url: 'http://127.0.0.1:'+launcherPort+'/setting/game/remove',
	  xhrFields: {
		withCredentials: false
	},
	method: 'post',           
	data: {id:id},
	dataType: 'json',
	crossDomain: true,
	contentType: 'application/x-www-form-urlencoded',
	processData: true,
	success: function(data){
		if (data.error==null){
			self.closest("tr").remove();
		}else{
			nError(data.error);
		}
		console.log(data.error==null);
    }
  });
});

//Голосование
$(document).on("click", "#vote", function(){
  	gameNick = $("#voteGameNick").val();
	if(gameNick.length<=1 || gameNick.length>=16){
		nError("Введите ник от 1 до 16 символов");
		return;
	}
  	$.ajax({
	url: 'http://127.0.0.1:'+launcherPort+'/vote',
	  xhrFields: {
		withCredentials: false
	},
	method: 'post',           
	data: {gameNick:gameNick},
	dataType: 'json',
	crossDomain: true,
	contentType: 'application/x-www-form-urlencoded',
	processData: true,
	success: function(data){
		if(data.error!=null){
			nError(data.error);
		}
		if (data.status==1){
			nSuccess("Увы успешно проголосовали");
			$('#showVoteDialog').modal('toggle')
		}
 		console.log(data);
    },
     error: function(xhr, status, error){
         var errorMessage = xhr.status + ': ' + xhr.statusText
		 nError("Извините, в данный момент голосование недоступно.<br>"+errorMessage);
     }
  });
});


//Сохранить в блокноте запись
$(document).on("click", "#noteSave", function(){
  	domain = $(this).data("domain");
	content = $("#note").val();
  	$.ajax({
		url: 'http://127.0.0.1:'+launcherPort+'/note/save',
		  xhrFields: {
			withCredentials: false
		},
		method: 'post',           
		data: {domain:domain, content:content},
		dataType: 'json',
		crossDomain: true,
		contentType: 'application/x-www-form-urlencoded',
		processData: true,
		success: function(data){
			if(data.ok==true){
				nSuccess("Запись добавлена");
				a = `<div class="mt-0">
				    <div class="form-group">
                     <textarea class="form-control" rows="9" id="note" placeholder="Сохраните заметки о сервере. Заметки отображаются только для данного сервера, вне зависимости от хроник, рейтов.">`+data.note.Content+`</textarea>
					</div>
                  </div>
				  
                  <div class="text-right">
                      <button type="button" id="noteRemove" data-id="`+data.note.ID+`" data-domain="`+data.note.Domain+`" class="btn btn-primary waves-effect waves-light mt-0"><i class="fa fa-send mr-1"></i> Удалить</button>
                      <button type="button" id="noteSaveEdit" data-id="`+data.note.ID+`" data-domain="`+data.note.Domain+`"  class="btn btn-primary waves-effect waves-light mt-0"><i class="fa fa-send mr-1"></i> Сохранить</button>
                  </div>`
				$("#noteDataCreate").html(a);
			}
			if(data.error){
				nError(data.error);
			}
			console.log(data);
		}
  });
});

//Чтение в блокноте запись
$(document).on("click", ".noteRead", function(){
  	id = $(this).data("id");
  	$.ajax({
		url: 'http://127.0.0.1:'+launcherPort+'/note/read',
		  xhrFields: {
			withCredentials: false
		},
		method: 'post',           
		data: {id:id},
		dataType: 'json',
		crossDomain: true,
		contentType: 'application/x-www-form-urlencoded',
		processData: true,
		success: function(data){
			a = `<div class="mt-0">
				    <div class="form-group">
                     <textarea class="form-control" rows="9" id="note" placeholder="Сохраните заметки о сервере. Заметки отображаются только для данного сервера, вне зависимости от хроник, рейтов.">`+data.note.Content+`</textarea>
					</div>
                  </div>
				  
                  <div class="text-right">
				      <button type="button" id="noteRemove" data-id="`+data.note.ID+`" data-domain="`+data.note.Domain+`" class="btn btn-primary waves-effect waves-light mt-0"><i class="fa fa-send mr-1"></i> Удалить</button>

                      <button type="button" id="noteSaveEdit" data-id="`+data.note.ID+`" data-domain="`+data.note.Domain+`"  class="btn btn-primary waves-effect waves-light mt-0"><i class="fa fa-send mr-1"></i> Сохранить</button>
                  </div>`
			$("#noteData").html(a);
		}
  });
});

//Перезаписать в блокноте
$(document).on("click", "#noteSaveEdit", function(){
  	id 		= $(this).data("id");
  	domain  = $(this).data("domain");
  	content = $("#note").val();
  	$.ajax({
		url: 'http://127.0.0.1:'+launcherPort+'/note/save/edit',
		  xhrFields: {
			withCredentials: false
		},
		method: 'post',           
		data: {id:id, domain:domain, content:content},
		dataType: 'json',
		crossDomain: true,
		contentType: 'application/x-www-form-urlencoded',
		processData: true,
		success: function(data){
			console.log(data);
 				h = `<table class="table table-hover"><tbody>`;
					c = ``;
					   $.each(data.note, function( i, note ) {
						 c = c+`<tr><td><label class="noteRead" data-id="`+note.ID+`" href="/notes/id/`+note.ID+`"><i class="fa fa-circle text-info mr-2"></i>`+ strLimit(note.Content, 70) +`</label></td></tr>`;
					   });
					f = `</tbody></table>`;
				$("#noteData").html(h + c + f);
				nSuccess("Заметка изменена");
		}
  });
});

//Получить записи сервера
$(document).on("click", "#allnote", function(){
  	domain = $(this).data("domain");
  	$.ajax({
		url: 'http://127.0.0.1:'+launcherPort+'/note/read/server',
		  xhrFields: {
			withCredentials: false
		},
		method: 'post',           
		data: {domain:domain},
		dataType: 'json',
		crossDomain: true,
		contentType: 'application/x-www-form-urlencoded',
		processData: true,
		success: function(data){
			if (data.note.length==0){
				$("#noteData").html("<label>У Вас нет записей к данному серверу, но Вы можете создать</label>");
			}else{
				h = `<table class="table table-hover"><tbody>`;
				c = ``;
				   $.each(data.note, function( i, note ) {
				   	 c = c+`<tr><td><label class="noteRead" data-id="`+note.ID+`" href="/notes/id/`+note.ID+`"><i class="fa fa-circle text-info mr-2"></i>`+ strLimit(note.Content, 70) +`</label></td></tr>`;
				   });
				f = `</tbody></table>`;
			$("#noteData").html(h + c + f);
			}
			console.log(data);
		}
  });
});


//Удаление заметки
$(document).on("click", "#noteRemove", function(){
  	id = $(this).data("id");
  	domain = $(this).data("domain");
  	$.ajax({
		url: 'http://127.0.0.1:'+launcherPort+'/note/remove',
		  xhrFields: {
			withCredentials: false
		},
		method: 'post',           
		data: {id:id, domain:domain},
		dataType: 'json',
		crossDomain: true,
		contentType: 'application/x-www-form-urlencoded',
		processData: true,
		success: function(data){
			
			$("#note").empty();
			$("#noteRemove").hide();
			
			$("#noteDataCreate").html(`<div class="mt-0">
						<div class="form-group">
						 <textarea class="form-control" rows="9" id="note" placeholder="Сохраните заметки о сервере. Заметки отображаются только для данного сервера, вне зависимости от хроник, рейтов."></textarea>
						</div>
					  </div>
					  
					  <div class="text-right">
						  <button type="button" id="noteSave" data-domain="`+domain+`" class="btn btn-primary waves-effect waves-light mt-0"><i class="fa fa-send mr-1"></i> Сохранить</button>
			 </div>`);
			
			nSuccess("Заметка удалена");
			
			
			
			if (data.note.length==0){
				$("#noteData").html("<label>У Вас нет записей к данному серверу, но Вы можете создать</label>");
			}else{
				h = `<table class="table table-hover"><tbody>`;
				c = ``;
				   $.each(data.note, function( i, note ) {
				   	 c = c+`<tr><td><label class="noteRead" data-id="`+note.ID+`" href="/notes/id/`+note.ID+`"><i class="fa fa-circle text-info mr-2"></i>`+ strLimit(note.Content, 70) +`</label></td></tr>`;
				   });
				f = `</tbody></table>`;
				$("#noteData").html(h + c + f);
 			}
			
			$('#noteTab a[href="#notes"]').tab('show');
			console.log(data);
		}
  });
});



function strLimit(string, length){
	if (string.length>length){
		return string.substring(0, length) + "...";
	}
	return string;
}

