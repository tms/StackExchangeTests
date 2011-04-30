// ==UserScript==
// @name          Comment link filter
// @description   A hook to transform raw links to properly titled links in comments
// @include       http://stackoverflow.com/*
// @include       http://meta.stackoverflow.com/*
// @include       http://superuser.com/*
// @include       http://meta.superuser.com/*
// @include       http://serverfault.com/*
// @include       http://meta.serverfault.com/*
// @include       http://askubuntu.com/*
// @include       http://meta.askubuntu.com/*
// @include       http://answers.onstartups.com/*
// @include       http://meta.answers.onstartups.com/*
// @include       http://stackapps.com/*
// @include       http://*.stackexchange.com/*
// @exclude       http://chat.stackexchange.com/*
// @exclude       http://chat.*.stackexchange.com/*
// @exclude       http://api.*.stackexchange.com/*
// @exclude       http://data.stackexchange.com/*
// @exclude       http://*/reputation
// @author        @TimStone
// ==/UserScript==

function inject() {
	for (var i = 0; i < arguments.length; ++i) {
		if (typeof(arguments[i]) == 'function') {
			var script = document.createElement('script');

			script.type = 'text/javascript';
			script.textContent = '(' + arguments[i].toString() + ')(jQuery)';

			document.body.appendChild(script);
		}
	}
}

inject(function ($) {
	function request(id, callback) {
		$.getJSON('http://api.' + window.location.hostname + '/1.1/questions/' + id + '?jsonp=?', callback);
	}
	
	function HijackedTextarea(t) {
		var textarea = t.addClass('link-hijacked'),
			form = textarea.closest('form'),
			checker = textarea.data('events').keyup[0].handler,
			link = new RegExp('(?:^|[^\\(])http://' + window.location.hostname + '/q(?:uestions)?/([0-9]+)', 'ig'),
			lock = false,
			submit = form.data('events').submit[0].handler;
			
		form.data('events').submit[0].handler = handler;
		
		function handler() {
			if (lock)
				return;

			lock = true;
		
			var url, ids = [];

			while (url = link.exec(textarea.val())) {
				ids.push(url[1]);
			}
			
			if (ids.length) {
				request(ids[0], callback);
			} else {
				submit.call(form.eq(0));
			}

			link.lastIndex = 0;
			
			return false;
		}
		
		function callback(data) {
			textarea.val(textarea.val().replace(new RegExp('(?:^|[^\\(])(http://' + window.location.hostname + '/q(?:uestions)?/' + data.questions[0].question_id + '[^\\s]+)', 'i'), '[' + data.questions[0].title + ']($1)')); 
			textarea.keyup();
			
			submit.call(form.eq(0));
		
			lock = false;
		}
	}
	
	$(document).ready(function () {
		$('textarea[name="comment"]:not(.link-hijacked)').live('focus', function () {
			new HijackedTextarea($(this));
		});
	});
});