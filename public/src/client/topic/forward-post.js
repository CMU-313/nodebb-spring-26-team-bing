'use strict';

define('forum/topic/forward-post', [
	'api', 'alerts', 'search', 'translator',
], function (api, alerts, search, translator) {
	const ForwardPost = {};
	const FORWARD_STORAGE_KEY = 'nodebb_forward_reply';

	// Add topic search bar into the composer
	$(window).on('action:composer.loaded', function (ev, data) {
		if (!app.forwardPostContext || !data || !data.postContainer) {
			return;
		}

		const postContainer = data.postContainer;
		const ctx = app.forwardPostContext;
		app.forwardPostContext = null;

		const header = $('<div class="p-2 d-flex flex-column gap-2 mb-2 forward-post-search"></div>');
		header.append(
			$('<div class="fw-semibold"></div>').text('Forward this post to another topic:')
		);

		const inputGroup = $(
			'<div class="input-group">' +
				'<input class="form-control forward-topic-search-input" type="text" placeholder="Search topics by title">' +
				'<span class="input-group-text"><i class="fa fa-search"></i></span>' +
			'</div>'
		);
		const resultsContainer = $(
			'<div class="quick-search-container d-block p-2 mt-1 hidden">' +
				'<div class="text-center loading-indicator"><i class="fa fa-spinner fa-spin"></i></div>' +
				'<div class="quick-search-results-container"></div>' +
			'</div>'
		);

		header.append(inputGroup);
		header.append(resultsContainer);

		postContainer.find('.composer-container, .title-container, .composer').first().before(header);

		if (!config.searchEnabled || !app.user.privileges['search:content']) {
			inputGroup.find('.forward-topic-search-input')
				.attr('disabled', true)
				.attr('placeholder', 'Search is disabled');
			return;
		}

		search.enableQuickSearch({
			searchElements: {
				inputEl: header.find('.forward-topic-search-input'),
				resultEl: resultsContainer,
			},
			searchOptions: {
				in: 'titles',
			},
		});

		header.on('click', '.quick-search-results [data-tid]', function (e) {
			e.preventDefault();
			e.stopPropagation();
			const tid = $(this).attr('data-tid');
			if (!tid) {
				return;
			}
			if (ajaxify.data.tid && String(tid) === String(ajaxify.data.tid)) {
				return alerts.error('Cannot forward a post to its own topic');
			}
			api.get(`/topics/${tid}`, {}).then(function (topicData) {
				if (!topicData || !topicData.slug) {
					return alerts.error('[[error:no-topic]]');
				}
				const currentBody = (postContainer.find('textarea').val() || '').trim() || (ctx.body || '');
				try {
					sessionStorage.setItem(FORWARD_STORAGE_KEY, JSON.stringify({
						tid: String(tid),
						title: topicData.title || '',
						body: currentBody,
					}));
				} catch (err) {
					return alerts.error(err);
				}

				// Close the current composer (if possible)
				postContainer.find('[component="composer/close"]').trigger('click');

				ajaxify.go('topic/' + topicData.slug);
			}).catch(alerts.error);
			return false;
		});
	});

	ForwardPost.getStoredForward = function () {
		try {
			const raw = sessionStorage.getItem(FORWARD_STORAGE_KEY);
			if (!raw) return null;
			const data = JSON.parse(raw);
			sessionStorage.removeItem(FORWARD_STORAGE_KEY);
			return data;
		} catch (e) {
			return null;
		}
	};

	return ForwardPost;
});
