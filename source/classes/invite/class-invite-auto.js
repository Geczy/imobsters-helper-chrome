var failCount;
var successCount;
var limitExceeded;

/**
 * Automatically invite a list of codes.
 */

function invite_auto() {

	failCount = 0;
	successCount = 0;
	limitExceeded = false;

	$(document.createElement('div')).addClass('modal_loading').appendTo('body');

	if (!invite_verify()) {
		return false;
	}

	var codes = invite_code_list();
	$("body").addClass("loading");

	invite_send(codes);

	$("body").ajaxStop(function() {
		var self = this;
		setTimeout(function() {
			$(self).removeClass('loading');
			$('div.modal_loading').remove();
			var exceededText = limitExceeded ? "\n\nCould not continue. Invite limit exceeded." : '';
			alert("Invites sent.\n\nInvited count: " + successCount + "\nFail count: " + failCount + exceededText);
		}, 500);
	});

}

/**
 * Check whether this user can use the invite.
 * @return {boolean} Shows an alert if there's an issue, and returns false.
 */

function invite_verify() {

	var level = get_current_level();

	if (!level) {
		alert("Action failed. Level could not be found.")
		return false;
	}

	if (level < 6) {
		alert("Action failed. You must be level 6+ to invite users.")
		return false;
	}

	return true;

}

function invite_code_list() {
	var list = options.invite_codes;
	return list.split(',');
}

/**
 * Invite users.
 * @param  {array} list A list of codes in array format.
 * @return {boolean}        An alert as well as boolean is returned on success / fail.
 */

function invite_send(list) {

	var list = invite_code_list();

	if (!list.length) {
		alert("Invite failed. There are no codes to invite.")
		return false;
	}

	for (var i in list) {
		if (!invite_submit_request(list[i])) {
			break;
		}
	}

	return true;

}

function invite_submit_request(code) {

	if (limitExceeded) {
		return false;
	}

	$.ajax({
		type: 'POST',
		url: 'group.php',
		async: false,
		data: {
			mobcode: code,
			action: 'Invite'
		},
		success: function(data) {
			invite_log_requests(data, code);
		}
	});

	return true;

}

function invite_log_requests(data, code) {

	var failed = $(data).find('.messageBoxFail').text();
	var success = $(data).find('.messageBoxSuccess').text();

	if (failed.length) {
		console.log(code + ": Failed. " + failed.replace('Insuccesso: ', ''));
		limitExceeded = (failed.indexOf('you have too many pending invites') > 0);
		failCount++;
	}

	if (success.length) {
		console.log(code + ": Success.");
		successCount++;
	}

	return limitExceeded;

}