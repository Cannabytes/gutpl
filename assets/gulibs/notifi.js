function round_default_noti(message){
			Lobibox.notify('error', {
		    pauseDelayOnHover: true,
		    size: 'mini',
		    rounded: true,
		    delayIndicator: false,
		    icon: 'fa fa-times-circle',
            continueDelayOnInactiveTab: false,
		    position: 'top right',
		    msg: message
		    });
}

function nError(message){
			Lobibox.notify('error', {
		    pauseDelayOnHover: true,
		    size: 'mini',
		    rounded: true,
		    delayIndicator: false,
		    icon: 'fa fa-times-circle',
            continueDelayOnInactiveTab: false,
		    position: 'top right',
		    msg: message
		    });
}
function nSuccess(message){
			Lobibox.notify('success', {
		    pauseDelayOnHover: true,
		    size: 'mini',
		    rounded: true,
		    delayIndicator: false,
		    icon: 'fa fa-check-circle-o',
            continueDelayOnInactiveTab: false,
		    position: 'top right',
		    msg: message
		    });
}