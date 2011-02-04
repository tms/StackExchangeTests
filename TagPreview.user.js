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
	var isMeta = location.host.match(/^meta\./i),
		style = null,
		colour = '#FFFFFF';

	if (isMeta) {
		var sample = document.createElement('span');
			sample.className = 'moderator-tag';
			sample.display = 'none';

		document.body.appendChild(sample);

		if (document.defaultView.getComputedStyle) {
			colour = document.defaultView.getComputedStyle(sample, null).getPropertyValue('color');
		} else if (sample.currentStyle) {
			colour = sample.currentStyle['color'];
		}

		document.body.removeChild(sample);

		var style = document.createElement('style');
			style.type = 'text/css';
			style.textContent = '.post-text a.moderator-tag { color: ' + colour + '; }' +
				'#wmd-preview a.required-tag {' +
					'border-bottom: ' + reqBorderWidth + ' solid ' + reqBorderColour + ';' +
				'}';
	}

	if (window.Attacklab == null || Attacklab.postSafeHtmlHook == null) {
		if (style) {
			document.getElementsByTagName('head')[0].appendChild(style);
		}

		return;
	}

	if (isMeta) {
		var modBorderColour = '',
			modBorderWidth = '',
			reqBorderColour = '',
			reqBorderWidth = '',
			plainBorderColour = '',
			plainBorderWidth = '',
			computedStyle = null,
			sample = document.createElement('span');
			sample.className = 'moderator-tag';
			sample.display = 'none';
			
		document.body.appendChild(sample);

		if (document.defaultView.getComputedStyle) {
			computedStyle = document.defaultView.getComputedStyle(sample, null);
			colour = computedStyle.getPropertyValue('color');
			modBorderWidth = computedStyle.getPropertyValue('border-bottom-width');
			modBorderColour = computedStyle.getPropertyValue('border-bottom-color');
			sample.className = 'required-tag';
			computedStyle = document.defaultView.getComputedStyle(sample, null);
			reqBorderWidth = computedStyle.getPropertyValue('border-bottom-width');
			reqBorderColour = computedStyle.getPropertyValue('border-bottom-color');
			sample.className = 'post-tag';
			computedStyle = document.defaultView.getComputedStyle(sample, null);
			plainBorderWidth = computedStyle.getPropertyValue('border-bottom-width');
			plainBorderColour = computedStyle.getPropertyValue('border-bottom-color');
		} else if (sample.currentStyle) {
			colour = sample.currentStyle['color'];
			modBorderWith = sample.currentStyle['borderBottomWidth'];
			modBorderColour = sample.currentStyle['borderBottomColor'];
			sample.className = 'required-tag';
			reqBorderWidth = sample.currentStyle['borderBottomWidth'];
			reqBorderColour = sample.currentStyle['borderBottomColor'];
			sample.className = 'post-tag';
			plainBorderWidth = sample.currentStyle['borderBottomWidth'];
			plainBorderColour = sample.currentStyle['borderBottomColor'];
		}

		document.body.removeChild(sample);

		style.textContent += '#wmd-preview a.post-tag {' +
					'border-bottom: ' + plainBorderWidth + ' solid ' + plainBorderColour + ';' +
				'}' +
				'#wmd-preview a.moderator-tag {' +
					'color: ' + colour + ';' +
					'border-bottom: ' + modBorderWidth + ' solid ' + modBorderColour + ';' +
				'}' +
				'#wmd-preview a.required-tag {' +
					'border-bottom: ' + reqBorderWidth + ' solid ' + reqBorderColour + ';' +
				'}';

		document.getElementsByTagName('head')[0].appendChild(style);
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
						var matched = false;

						for (var i = 0; i < tags.sub.length && !matched; ++i) {
							matched = tags.sub[i] == special[2];
						}
						
						if (matched) {
							cssClass = (tags.mod ? 'moderator' : 'required') + '-tag';
						}
					}
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