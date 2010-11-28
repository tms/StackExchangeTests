// ==UserScript==
// @name          SE Comment Context Fix
// @description   An attempted workaround for Firefox contenxt menu enter key presses being misinterpreted
// @include       http://stackoverflow.com/questions/*
// @include       http://meta.stackoverflow.com/questions/*
// @include       http://superuser.com/questions/*
// @include       http://meta.superuser.com/questions/*
// @include       http://serverfault.com/questions/*
// @include       http://meta.serverfault.com/questions/*
// @include       http://askubuntu.com/questions/*
// @include       http://meta.askubuntu.com/questions/*
// @include       http://answers.onstartups.com/questions/*
// @include       http://meta.answers.onstartups.com/questions/*
// @include       http://nothingtoinstall.com/questions/*
// @include       http://meta.nothingtoinstall.com/questions/*
// @include       http://seasonedadvice.com/questions/*
// @include       http://meta.seasonedadvice.com/questions/*
// @include       http://*.stackexchange.com/questions/*
// @exclude       http://chat.stackexchange.com/*
// @exclude       http://chat.*.stackexchange.com/*
// @exclude       http://api.*.stackexchange.com/*
// @exclude       http://odata.stackexchange.com/*
// @exclude       http://area51.stackexchange.com/*
// @author        @Tim Stone
// ==/UserScript==

function with_jquery(f) {
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.textContent = "(" + f.toString() + ")(jQuery)";
    document.body.appendChild(script);
};

with_jquery(function ($) {
	function hook() {
		var commentBoxes = $("textarea[name='comment']:not(.patched)"),
			events = commentBoxes
				.addClass("patched")
				.data('events'),
			found = false;

		if (events.keyup) {
			for (var i = events.keyup.length - 1; !found && i > 0; --i) {
				var stringified = events.keyup[i].toString();
				
				if (found = stringified.matches(/\.which ?== ?13 ?&& ? ![^.]+\.shiftKey/)) {
					var handler = events.keyup.splice(i, 1);

					if (!events.keydown)
						events.keydown = [];

					events.keydown.push(handler);
				}
			}
		}
	}

	$(function () {
		$(document).ajaxComplete(function(event, request, options) {
			if (options && options.url.matches(/^\/posts\/[0-9]+\/comments/)) {
				hook();
			}
		});
	});
});