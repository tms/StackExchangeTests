// ==UserScript==
// @name          SE Tag Popup Ignore Link Adder
// @description   A hook to add a tag ignore link to the tag popup
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
	StackExchange.ready(function () {
		var ignored, delayed = !$('#ignoredTags').length, requested = false;
		
		// If we aren't logged in, don't do anything
		if (!StackExchange.loggedIn)
			return;
		
		$('<style>').text(
			'#tag-menu .tm-ignored-on {' +
				'font-size:13px;' +
				'text-decoration:none;' +
				'color:#FF7777;' +
			'}'
		).appendTo('head');

		// Hijack the spinner as a relatively reliable way to know when a tag menu has
		// been loaded
		StackExchange.helpers._removeSpinner = StackExchange.helpers.removeSpinner;
		StackExchange.helpers.removeSpinner = function () {
			var $tagmenu = $('#tag-menu');
				ignored = ignored || delayed || $('#ignoredTags').text();
				ignored = typeof ignored === 'string' ? ignored : false;

			// Check if we actually have a tag menu, and if so, that we haven't already
			// modified it
			if ($tagmenu.length && !$tagmenu.find('.tm-ignore').length) {
				if (!ignored && delayed && !requested) {
					requested = true;

					// We have to pull the ignored list out of the profile
					// Hopefully I won't get scolded for that
					(delayed = $('<div>')).load(
						$('#hlinks-user .profile-link')[0].href + 
							'?tab=prefs #ignoredTags',
						function () {
							ignored = delayed.text();
							delayed = true;
							
							// We may have a different tag menu now, or not one at all
							linkify($('#tag-menu'));
						});
				} else {
					linkify($tagmenu);
					
					// The ignored list could be updated in the interim, so make sure we
					// always grab it again on pages where it can be changed outside of
					// these dialogs
					ignored = false;
				}
			}
			
			// Be sure to actually remove the spinner
			StackExchange.helpers._removeSpinner();
		};
		
		function linkify($target, tag) {
			if (!$target.length)
				return;
			
			if (!tag) {
				// Figure out what this tag menu is actuall for, since we're unsure
				tag = $('.tm-sub-links a:last', $target)[0].href;
				tag = tag.substring(tag.lastIndexOf('/') + 1);
			}
			
			var ignoring = isIgnoring(tag), requesting = false;
		
			// Insert the ignore link (I wanted a unicode 'No Entry', but I couldn't find
			// one that was well-supported, so you get radioactivity instead)
			$('.tm-sub-info a:first', $target).after(
				toggle($('<a>☢</a>').css({
					'margin-left': '3px',
					'margin-right': '2px'
				}), ignoring).click(function () {
					self = $(this);
				
					if (!delayed) {
						// If we're on a page with the proper controls, use them to
						// ensure interface consistency
						if (ignoring) {
							$('#ignoredTags').find('a:contains(' + tag + ') .delete-tag')
								.click();
						} else {
							$('#ignoredTag').val(tag);
							$('#ignoredAdd').click();
						}
						
						toggle(self, ignoring = !ignoring);
					} else if (!requesting) {
						// Otherwise we have to make the request ourselves
						requesting = true;
						ignored = ignoring ? ignored.replace(
							new RegExp('(:?^|\s)' + quote(tag) + ' (:?\s|$)'), ''
						) : ignored + tag + ' ';
						
						if (ignored.search(/[^\s]/) === -1)
							ignored = '';
						
						$.post('/users/save-preference', {
								'fkey': StackExchange.options.user.fkey,
								'key': 25,
								'value': ignored
							}, function (response) {
								if (response === 'true')
									toggle(self, ignoring = !ignoring);
									
								requesting = false;
							});
					}
				})
			);
		}
		
		function toggle($link, ignoring) {
			return $link
				.addClass(ignoring ? 'tm-ignored-on' : 'tm-favorite-off')
				.removeClass(!ignoring ? 'tm-ignored-on' : 'tm-favorite-off')
				.attr('title',
					(ignoring ? 'remove' : 'add') + ' this tag ' +
					(ignoring ? 'from' : 'to') + ' your ignored list'
				);
		}
		
		function isIgnoring(tag) {
			return tag && ignored && ignored.search(
				new RegExp('(:?^|\s)' + quote(tag) + ' (:?\s|$)')
			) !== -1;
		}
		
		function quote(text) {
			return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
		}
	});
});