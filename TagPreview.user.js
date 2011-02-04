// ==UserScript==
// @name          Tag Preview Hook
// @description   A hook to enable [tag:] previews in WMD
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
// @include       http://nothingtoinstall.com/*
// @include       http://meta.nothingtoinstall.com/*
// @include       http://seasonedadvice.com/*
// @include       http://meta.seasonedadvice.com/*
// @include       http://crossvalidated.com/*
// @include       http://meta.crossvalidated.com/*
// @include       http://stackapps.com/*
// @include       http://*.stackexchange.com/*
// @exclude       http://chat.stackexchange.com/*
// @exclude       http://api.*.stackexchange.com/*
// @exclude       http://data.stackexchange.com/*
// @exclude       http://area51.stackexchange.com/*
// @exclude       http://*/reputation
// @author        @TimStone
// ==/UserScript==

function loader(f) {
	var script = document.createElement('script');
	    script.type = 'text/javascript';
	    script.textContent = '(' + f.toString() + ')()';

	document.body.appendChild(script);
}

loader(function() {
	var isMeta = location.host.match(/^meta\./i);

	if (isMeta) {
		try {
		var style = document.createElement('style');
			style.type = 'text/css';
			style.textContent = '#wmd-preview a.moderator-tag, .post-text a.moderator-tag { color: #FFFFFF; }';

		document.getElementsByTagName('head')[0].appendChild(style);
		} catch (e) {
			console.log(e);
		}
	}

	if (window.Attacklab == null || Attacklab.postSafeHtmlHook == null) {
		return;
	}

	var original = Attacklab.postSafeHtmlHook,
		main = 'http://' + location.host.replace(/^meta\./i, ''),
	    metaTags = {
			'status' : {
			 	'sub' : [
					'completed',
					'deferred',
					'bydesign',
					'norepro',
					'declined',
					'planned',
					'review',
					'reproduced'
				],
				'mod' : true
			},
			'faq' : {
				'mod' : true
			},
			'featured' : {
				'mod' : true
			},
			'discussion' : {
				'mod' : false
			},
			'feature' : {
				'sub' : [
					'request'
				],
				'mod' : false
			},
			'support' : {
				'mod' : false
			},
			'bug' : {
				'mod' : false
			}
		},
		tagify = function(wholeMatch, type, tag) {
			var cssClass = '',
				url = '',
				type = type.toLowerCase(),
				tag = tag.toLowerCase(),
				escapedTag = encodeURIComponent(tag);

			if (!type.match(/tag$/)) {
				return wholeMatch;
			}

			if (type == 'meta-tag') {
				if (!isMeta) {
					return wholeMatch;
				}

				var special = tag.match(/([^-]+)(?:-(.*))?/) || [tag],
					tags = metaTags[special[1]];

				if (tags) {
					if (special[2] && tags.sub) {
						for (var i = 0; i < tags.sub.length; ++i) {
							if (tags.sub[i] == special[2]) {
								break;
							}

							if (i == tags.sub.length - 1) {
								return wholeMatch;
							}
						}
					} else if (special[2]) {
						return wholeMatch;
					}

					cssClass = (tags.mod ? 'moderator' : 'required') + '-tag';
				} else {
					return wholeMatch;
				}
			} else if (type != 'tag') {
				return wholeMatch;
			}
			
			if (type == 'tag' && isMeta) {
				url = main;
			}

			return '<a class="post-tag ' + cssClass + '" rel="tag" href="' + url + '/questions/tagged/' + escapedTag + '">' + tag + '</a>';
		};

	Attacklab.postSafeHtmlHook = function(e) {
		return original(e.replace(/\[((?:meta-)?tag):([^\]]+)\]/gi, tagify));
	}
});