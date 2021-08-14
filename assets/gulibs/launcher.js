var launcherURL = 'http://127.0.0.1:' + 12550;
var timeoutRequest = 560;
var activePage = true;

/** Что необходимо будет реинсталировать */
function reinit() {
    $('#default-datatable').DataTable({
        "order": [3, 'DESC']
    });
}

/** Создание линков на страницы */
function copyLink() {
    var href = document.location.href.replace('http://localhost:12550/', 'open-launcher://');
    $("#hyperlink").val(href);
    $("#htmllink").val("<a href='" + href + "'>" + document.title + "</a>");
    $("#bbcodelink").val("[URL='" + href + "']" + document.title + "[/URL]");
    $("#shortcutlink").val(document.location.href.replace('http://localhost:12550/', ''));
    $("#shortcutname").val(document.title);
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

/** Аякс подгрузка элементов, ссылкам добавляем класс aj */
$(document).on('click', '.aj', function (e) {
    e.preventDefault();
    var href = $(this).prop('href');
    if (window.location.href == href) {
        return;
    }
    addActiveMenu($(this), href)
    load(href);
});

function load(href) {
    $.ajax({
        type: "POST",
        url: href,
        crossDomain: true,
        success: function (data) {
            $('#dateStart').datepicker({
                autoclose: true,
                todayHighlight: true
            });
            $(".container-fluid").html(data);
            reinit();
            window.history.pushState("object or string", "Title", href);
            info();
            configLoad();
            copyLink();
        }
    });
}

reinit();
copyLink();

/** Конфигурация лаунчера */
var LauncherConfig;
var userLang;
configLoad();
/** Загрузка конфигурации */

console.log(lang[userLang][0], LauncherConfig.Status);

/**
 Статусы лаунчера
		0 - Ничего не происходит
		1 - Идет обновление патча
		2 - Загрузка данных патча
		3 - Обработка данных патча
		4 - Поиск патчей из архивов
		5 -  НЕ ИСПОЛЬЗУЕТСЯ
		6 -  НЕ ИСПОЛЬЗУЕТСЯ
		7 - Произошла ошибка
		8 - Проверка соответствия файлов
		9 - Загрузка отменена

 */
info();

if (LauncherConfig.Status != 0 ) {
}

/** Загрузка конфигурации */
function configLoad() {
    $.ajax({
        url: launcherURL + '/get/config',
        xhrFields: {
            withCredentials: false
        },
        method: 'post',
        dataType: 'json',
        crossDomain: true,
        processData: true,
        async: false,
        contentType: 'application/x-www-form-urlencoded',
        success: function (LConfig) {
			console.log(LConfig);
            LauncherConfig = LConfig;
			userLang = LauncherConfig.Config.Lang;
            for (var i = 1; i <= LauncherConfig.Config.User.Streams; i++) {
                $("#GU_tableLoads").append(`<div class="progress-wrapper mb-4">
														<div><nobr id="GU_progress_file_id-${i}">`+lang[userLang][1]+`</nobr><span class="float-right" id="GU_files_update_percent-${i}">0%</span></div>
														<div class="progress" style="height:7px;">
															<div id="GU_progress_bar_id-${i}" class="progress-bar gradient-ibiza" style="width:0%"></div>
														</div>
													</div>`);
            };
            if (LauncherConfig.Config.GameServer.ID == -1) {
                $("#favoriteMenu").hide();
            } else {
                if (LauncherConfig.Config.GameServer.Domain != "") {

                    $("#favoriteMenu").show();
                    $("#favoriteMenu").html('<i class="zmdi zmdi-dot-circle-alt"></i> ' + new URL(LauncherConfig.Config.GameServer.Domain).hostname);
                    $("#favoriteMenu").attr("href", "/server/id/" + LauncherConfig.Config.GameServer.ID);
                }
            }
        },
        error: function () {
            alert('Error occured');
        }
    });
}

function info() {
    serverID = window.location.pathname.split('/server/id/')[1];
    var timerRequest = setInterval(
        function () {
            if (activePage == false) {
                return;
            }
            $.ajax({
                url: launcherURL + '/info',
                xhrFields: {
                    withCredentials: false
                },
                method: 'post',
                dataType: 'json',
                crossDomain: true,
                contentType: 'application/x-www-form-urlencoded',
                processData: true,
                error: function (xhr, status, error) {
					alert("ERROR");
                    clearInterval(timerRequest);
                },
                success: function (data) {
                    console.log(data);
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
					 
                    const hostname = new URL(window.location.href).hostname;
                    if (data.Config.GameServer.Domain == hostname) {
                        $("#GU_connector").remove();
                    }
					
                    if (serverID != data.Config.GameServer.ID) {
                        clearInterval(timerRequest);
                        return;
                    }
					 
                    var code = StatusButtonStartGame(data);
					if (code==1){
						clearInterval(timerRequest); 
					}
                }
            })
        }, timeoutRequest);

}

/** Создание ярлыка */
$(document).on("click", "#shortcut", function () {
	
    let params = {
        shortcutlink: $("#shortcutlink").val(),
        shortcutname: $("#shortcutname").val()
    };

	ajq('/shortcut/save', params, function(data) {
 			if (data.error==null){
				nSuccess("Ярлык на страницу успешно создан");
			}else{
				nError(data.error);
			}
	});
	 
});


/**
 Запуск обновления
 */
$(document).on("click", "#GU_patch", function () {
    serverID = window.location.pathname.split('/server/id/')[1];
    getClientPath = $("#getClientPath").val();
    let params = {
        serverID: serverID,
        getClientPath: getClientPath
    };
	$("#panelLoad").show();
	
	info();
	
	$.ajax({
	url: launcherURL+'/download',        
	xhrFields: {
		withCredentials: false
	},
	method: 'post',            
	dataType: 'json',
	crossDomain: true,
	contentType: 'application/x-www-form-urlencoded',
    data: params,
	success: function(data){
		console.log(data);
		if(data.Error){
			nError(data.Error);
		}else{
			$("#favoriteMenu").show();
			if (data.ServerID == null || data.ServerID == 0) {
				$("#favoriteMenu").data("href", "/launcher");
				nError(lang[userLang][19]);
			} else {
				$("#favoriteMenu").html('<i class="zmdi zmdi-dot-circle-alt"></i> ' + new URL(data.Domain).hostname);
				$("#favoriteMenu").attr("href", "/server/id/" + data.ServerID);
			}
		}
	}
});

});


//Меняем текст кнопок обновления
//Возращает 1 если цикл проверок нужно завершить
function StatusButtonStartGame(data) {
    switch (data.Status) {
        case 0:
			$("#processName").text("Загрузка файлов");
			return 1; 
        case 1:
			$("#processName").text("Загрузка файлов");
            $("#GU_patch").text(lang[userLang][2]);
            $("#GU_patchEvent").text(data.LastMsg);
            if (data.CountFiles > 0) {
                $("#ProcentLoad").css('width', ProcentLoad + '%');

                $("#getFilesUp").text(data.CountFilesUploaded + "/" + data.CountFiles);
                $("#CountFilesUploaded").text(data.CountFilesUploaded);
                $("#CountFiles").text(data.CountFiles);
                $("#getSizeDl").text(data.SizeRemainsDownloadStr + "/" + FullSizeFileStr);
                $("#Status").text(Status);

                $("#GU_patchEventAddLine").text(lang[userLang][3]+" " + data.SizeRemainsDownloadStr);
                document.title = lang[userLang][3]+" " + data.SizeRemainsDownloadStr;

                $.each(data.GetDownloads, function (id, value) {
                    $("#GU_progress_file_id-" + (id + 1)).text(value.Path);
                    $("#GU_files_update_percent-" + (id + 1)).text(value.DownloadPercent + "%");
                    $("#GU_progress_bar_id-" + (id + 1)).css('width', value.DownloadPercent + '%');
                });
            }
            return; 
        case 2: $("#processName").text("Загрузка данных патча");return; 
 		case 3: $("#processName").text("Обработка данных патча");return; 
		case 4: $("#processName").text("Поиск патчей из архивов");return; 
		case 5:
        case 6:
            $("#GU_patch").text(lang[userLang][4]);
            document.title   =  lang[userLang][4];

            $("#CountFilesUploaded").text(data.CountFilesUploaded);
            $("#CountFiles").text(data.CountFiles);

            $.each(data.GetDownloads, function (id, value) {
                $("#GU_progress_file_id-" + (id + 1)).text(value.Path);
                $("#GU_files_update_percent-" + (id + 1)).text("100%");
                $("#GU_progress_bar_id-" + (id + 1)).css('width', '100%');
            });
            $("#ProcentLoad").css('width', '100%');
            $("#GU_patchEvent").text(data.LastMsg);
            $("#l2exe").show();
			$("#processName").text("Завершено");
			return 1;
        case 7:
        case 9:
            $("#GU_patch").text(lang[userLang][5]);
            $("#GU_patchEvent").text(data.LastMsg);
			return 1;
        case 8: //Произошла ошибка (к примеру, память диска закончилась)
			$("#processName").text("Ошибка обновления: "+data.LastMsg);
			nError(data.LastMsg);
            $("#GU_patchEvent").text(lang[userLang][6]);
            document.title = lang[userLang][6];
            $("#GU_patchEvent").append("<br>Error: " + data.LastMsg);
			return 1;
    }
}



function ajq(href, params, scs) {
    $.ajax({
        url: launcherURL + href,
        xhrFields: {
            withCredentials: false
        },
        method: 'post',
        data: params,
        dataType: 'json',
        crossDomain: true,
        processData: true,
        contentType: 'application/x-www-form-urlencoded',
		success: scs 
    });
}

$(document).on("click", "#l2exe", function() {
	let params = {
		exe : $(this).data("exe"),
		args : $(this).data("args"),
		serverid : $(this).data("serverid"),
		getClientPath : $("#getClientPath").val() 
    };
	l2exe(params);
	info();
});

function l2exe(params) {
	ajq('/game/start', params, function(data) {
 			if (data.error){
				nError(data.error);
			}
	});
}

$(document).on('click', '#savePathClient', function(e) {
 	
	let params = {
		version : $("#clientVersion").val(),
		name : $("#clientname").val(),
		path : $("#clientSetPath").val() 
    };
	
	ajq('/setting/games/set/save', params, function(data) {
 			if (data.error) {
				nError(data.error);
			} else {
				$("#clientsPathList").empty();
				$.each(data.AllWays, function(id, way) {
					$('#clientsPathList').append('<tr>\
                    <td>\
					<span class="badge badge-danger removeClient" data-id="' + way.ID + '"><i class="fa fa-remove"></i></span> ' + way.ChronicleTitle + '</td>\
                    <td>' + way.Name + '</td>\
                    <td>' + way.Path + '</td>\
                  </tr>');
				});
			}
 	}); 
});

var timerRequestCrPath = null;
//Узнаем о создании патч листа
getCreatePathInfo(); 
$(document).on('click', '#createPatchServer', function(e) {
	timerRequestCrPath = setInterval(getCreatePathInfo, 300);
	
	let params = {
		savedirclientpath : $("#savedirclientpath").val(),
		savedirupdate : $("#savedirupdate").val(),
		version : $("#version").val(),
		chronicle : $("#chronicle").val()
    };
	
	ajq('/setting/patch/create/start', params, function(data) {}); 
	
});

function getCreatePathInfo() {
	let params = {};
	ajq('/setting/patch/create/start/get', params, function(data) {
			status = data.status;
			allSize = data.allSize;
			countFiles = data.countFiles;
			countCreateFiles = data.countCreateFiles;
			timeWork = data.timeWork;
			if (status == 0) {
				status = lang[userLang][7];
			}
			if (status == 1) {
				status =  lang[userLang][8];
			}
			if (status == 2) {
				status = lang[userLang][9];
				clearInterval(timerRequestCrPath);
			}
			$("#filesCreateData").text(countCreateFiles + " / " + countFiles);
			$("#filesCreateDataSize").text(allSize);
			$("#filesCreateDataTime").text(timeWork);
			$("#filesCreateDataStatus").text(status);
	}); 
}

function loadBlockHTMLServerSelect(serverID, elementid, linkblock) {
		$.ajax({
			url: launcherURL + '/html/load/' + linkblock,
			xhrFields: {
				withCredentials: false
			},
			method: 'post',
			data: {
				serverID: serverID
			},
			dataType: 'html',
			crossDomain: true,
			contentType: 'application/x-www-form-urlencoded',
			processData: true,
			success: function(data) {
				$("#serverSelect").html(data);
			}
		});
}

/**
	Сохранение настроек
**/
$(document).on("change", ".gu_settings", function() {
	if ($(this).prop("type") == "checkbox") {
		settingName = $(this).data("sname");
		settingValue = $(this).is(":checked");
	} else {
		settingName = $(this).data("sname");
		settingValue = $(this).val();
	}
	let params = {
		settingName: settingName,
		settingValue: settingValue
	};
	ajq('/settings/save', params, function(data) {}); 
});

/**
	Сохранение настройки автозагрузки
**/
$(document).on("click", ".gu_settings_autoload", function() {
	if ($(this).prop("type") == "checkbox") {
		settingName = $(this).data("sname");
		settingValue = $(this).is(":checked");
	}
	let params = {
		settingName: settingName,
		settingValue: settingValue
	};
	ajq('/settings/save/autoload', params, function(data) {}); 
});

$(document).on("click", "#saveInputPathSetting", function() {
	settingName = "pathSetting";
	settingValue = $("#savePathSetting").val();
	let params = {
		settingName: settingName,
		settingValue: settingValue
	};
	ajq('/settings/save', params, function(data) {}); 
});


$(document).on("click", "#addblockfile", function() {
	filename = $("#filename").val();
	chronicle = $("#chronicle").val();
	let params = {
		filename: filename,
		chronicle: chronicle
	};
	ajq('/setting/block/add', params, function(data) {
		$("#blocklists").append(`<tr>
                        <td><h5 class="mb-0"><span class="removeBlocklist" data-id="` + data.ID + `" ><i aria-hidden="true" class="fa fa-remove"></i></span> ` + data.Filename + `</h5></td>
                        <td>` + data.Chronicle + `</td>
                    </tr>`);
	});  
});


$(document).on("click", ".removeBlocklist", function() {
	thisButt = $(this);
	id = thisButt.data("id");
	let params = {
		id: id
	};
	ajq('/setting/block/remove', params, function(data) {
		thisButt.closest('tr').remove();
	});
});

function isValidHttpUrl(string) {
	let url;

	try {
		url = new URL(string);
	} catch (_) {
		return false;
	}

	return url.protocol === "http:" || url.protocol === "https:";
}

$(document).on("click", "#gu_patchCreateLink", function() {
	if (isValidHttpUrl($("#Domain").val()) == false) {
		nError(lang[userLang][10]);
		return;
	}
	if (isValidHttpUrl($("#PatchDBLink").val()) == false) {
		nError(lang[userLang][11]);
		return;
	}
	if (isValidHttpUrl($("#FileArchivesLink").val()) == false) {
		nError(lang[userLang][12]);
		return;
	}
	
	let params = {
		Domain: $("#Domain").val(),
		Chronicle: $("#Chronicle").val(),
		PatchDBLink: $("#PatchDBLink").val(),
		FileArchivesLink: $("#FileArchivesLink").val(),
		
		L2exeapp: $("#l2exeapp").val(),
		L2exeargs: $("#l2exeargs").val(),
		
		EXP: $("#Exp").val(),
		SP: $("#SP").val(),
		Drop: $("#Drop").val(),
		Adena: $("#Adena").val(),
		Spoil: $("#Spoil").val(),
		Quest: $("#Quest").val(),
		
		timeStart: $("#timeStart").val(),
		dateStart: $("#dateStart").val(),
		
		Style: $("#ServerVersion").val(),
		TimeZone: $("#TimeZone").val(),
		MaxEnchant: $("#MaxEnchant").val(),
		SafeEnchant: $("#SafeEnchant").val(),
		
		gmshop: $("#gmshop").is(':checked'),
		buffer: $("#buffer").is(':checked'),
		globalGK: $("#globalGK").is(':checked'),
		offlineTrade: $("#offlineTrade").is(':checked'),
		soft: $("#soft").is(':checked'),
		macros: $("#macros").is(':checked'),
		ss: $("#ss").is(':checked'),
		newbiehelp: $("#newbiehelp").is(':checked'),
		autoregistration: $("#autoregistration").is(':checked'),
		code: $("#code").text()
	};
	
	ajq('/setting/patch/create/link', params, function(data) {
			if (data["error"]) {
				nError(data["error"]);
				return;
			}
			$('#gulink').text(data);
	});

});


//Удаление месторасположения клиента
$(document).on("click", ".removeClient", function() {
	thisButt = $(this);
	let params = {
		id : thisButt.data("id")
	};

	ajq('/setting/game/remove', params, function(data) {
			if (data.error == null) {
				thisButt.closest("tr").remove();
			} else {
				nError(data.error);
			}
	});
 
}); 

//Голосование
$(document).on("click", "#vote", function() {
	gameNick = $("#voteGameNick").val();
	if (gameNick.length <= 1 || gameNick.length >= 16) {
		nError(lang[userLang][20]);
		return;
	}
	
	let params = {
		gameNick : gameNick
	};
	
	ajq('/vote', params, function(data) {
		if (data.error != null) {
			nError(data.error);
		}
		if (data.status == 1) {
			nSuccess(lang[userLang][21]);
			$('#showVoteDialog').modal('toggle')
		}
	});
 
});


//Сохранить в блокноте запись
$(document).on("click", "#noteSave", function() {
 	let params = {
		domain  : $(this).data("domain"),
		content : $("#note").val()
	};
	ajq('/note/save', params, function(data) {
		if (data.ok == true) {
				nSuccess(lang[userLang][14]);
				a = `<div class="mt-0">
				    <div class="form-group">
                     <textarea class="form-control" rows="9" id="note" placeholder="`+lang[userLang][15]+`">` + data.note.Content + `</textarea>
					</div>
                  </div>
				  
                  <div class="text-right">
                      <button type="button" id="noteRemove" data-id="` + data.note.ID + `" data-domain="` + data.note.Domain + `" class="btn btn-primary waves-effect waves-light mt-0"><i class="fa fa-send mr-1"></i> Удалить</button>
                      <button type="button" id="noteSaveEdit" data-id="` + data.note.ID + `" data-domain="` + data.note.Domain + `"  class="btn btn-primary waves-effect waves-light mt-0"><i class="fa fa-send mr-1"></i> Сохранить</button>
                  </div>`
				$("#noteDataCreate").html(a);
			}
			if (data.error) {
				nError(data.error);
			}
	});

});

//Чтение в блокноте запись
$(document).on("click", ".noteRead", function() {
	id = $(this).data("id");
 	let params = {
		id : id 
	};
	ajq('/note/read', params, function(data) {
			a = `<div class="mt-0">
				    <div class="form-group">
                     <textarea class="form-control" rows="9" id="note" placeholder="`+lang[userLang][15]+`">` + data.note.Content + `</textarea>
					</div>
                  </div>
				  
                  <div class="text-right">
				      <button type="button" id="noteRemove" data-id="` + data.note.ID + `" data-domain="` + data.note.Domain + `" class="btn btn-primary waves-effect waves-light mt-0"><i class="fa fa-send mr-1"></i> `+lang[userLang][23]+`</button>

                      <button type="button" id="noteSaveEdit" data-id="` + data.note.ID + `" data-domain="` + data.note.Domain + `"  class="btn btn-primary waves-effect waves-light mt-0"><i class="fa fa-send mr-1"></i> `+lang[userLang][24]+`</button>
                  </div>`;
			$("#noteData").html(a);
		}); 
 });
 
 //Перезаписать в блокноте
$(document).on("click", "#noteSaveEdit", function() {
	let params = {
		id : $(this).data("id"),
		domain : $(this).data("domain"),
		content : $("#note").val() 
	}; 
	ajq('/note/save/edit', params, function(data) {
		nSuccess(lang[userLang][16]);
	}); 
});
//Получить записи сервера
$(document).on("click", "#allnote", function() {
	let params = {
		domain : $(this).data("domain")
	}

	ajq('/note/read/server', params, function(data) {
		if (data.note.length == 0) {
				$("#noteData").html("<label>"+lang[userLang][16]+"</label>");
			} else {
				h = `<table class="table table-hover"><tbody>`;
				c = ``;
				$.each(data.note, function(i, note) {
					c = c + `<tr><td><label class="noteRead" data-id="` + note.ID + `" href="/notes/id/` + note.ID + `"><i class="fa fa-circle text-info mr-2"></i>` + strLimit(note.Content, 70) + `</label></td></tr>`;
				});
				f = `</tbody></table>`;
				$("#noteData").html(h + c + f);
			}
	}); 
	
});

//Удаление заметки
$(document).on("click", "#noteRemove", function() {

	let params = {
		id : $(this).data("id"),
		domain : $(this).data("domain")
	}

	ajq('/note/remove', params, function(data) {
					$("#note").empty();
			$("#noteRemove").hide();

			$("#noteDataCreate").html(`<div class="mt-0">
						<div class="form-group">
						 <textarea class="form-control" rows="9" id="note" placeholder="Сохраните заметки о сервере. Заметки отображаются только для данного сервера, вне зависимости от хроник, рейтов."></textarea>
						</div>
					  </div>
					  
					  <div class="text-right">
						  <button type="button" id="noteSave" data-domain="` + $(this).data("domain") + `" class="btn btn-primary waves-effect waves-light mt-0"><i class="fa fa-send mr-1"></i> Сохранить</button>
			 </div>`);

			nSuccess("Заметка удалена");


			if (data.note.length == 0) {
				$("#noteData").html("<label>У Вас нет записей к данному серверу, но Вы можете создать</label>");
			} else {
				h = `<table class="table table-hover"><tbody>`;
				c = ``;
				$.each(data.note, function(i, note) {
					c = c + `<tr><td><label class="noteRead" data-id="` + note.ID + `" href="/notes/id/` + note.ID + `"><i class="fa fa-circle text-info mr-2"></i>` + strLimit(note.Content, 70) + `</label></td></tr>`;
				});
				f = `</tbody></table>`;
				$("#noteData").html(h + c + f);
			}

			$('#noteTab a[href="#notes"]').tab('show');
			console.log(data);

	}); 
 
});



function strLimit(string, length) {
	if (string.length > length) {
		return string.substring(0, length) + "...";
	}
	return string;
}

$(document).on("click", "#gu_addingdonwload", function() {
	let params = {
		ids : $(this).data("ids")
	}
	ajq('/adding/download', params, function(data) {});
});

//Открывает папку
$(document).on("click", "#openDirectory", function() {
 	let params = {
		path : $(this).data("path")
	};
	ajq('/open/directory', params, function(data) {});
});

$(document).on("click", "#screensave", function() {
	let params = {};
	ajq('/gallery/save', params, function(data) {
		if (data.error) {
				nError(data.error);
			} else if (data.countScreens == 0) {
				nInfo(lang[userLang][18]);
			} else {
				countScreens = data.countScreens;
				nSuccess(lang[userLang][22]);
				$.each(data.screens, function(id, value) {
					$("#screens").prepend("<div class=\"col-md-6 col-lg-3 col-xl-3\">\
						<a href=" + value + " data-fancybox=\"group2\">\
							<img src=" + value + " alt=\"lightbox\" class=\"lightbox-thumb img-thumbnail\">\
						</a>\
					</div>");
				});
			}
	});
});

$(document).on("click", ".copytext", function() {
	var copyid = $(this).data("copyid");
	
	var copyText = document.getElementById(copyid);
	
	 /* Выделите текстовое поле */
	copyText.select();
	
	 /* Скопируйте текст внутри текстового поля */
	var status = document.execCommand('copy');
	 
	if(!status){
		console.error("Cannot copy text");
	}else{
		nInfo("Текст был скопирован");
	}
	 
});

 