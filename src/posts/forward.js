'use strict';

/**
 * Build the reply body for a "forwarded" post (blockquote with header + quoted content).
 * Used by the forward-post feature and by API/tests.
 * @param {string} topicTitle - Title of the topic the post is from
 * @param {string} postUrl - Full or relative URL to the source post
 * @param {string} rawContent - Raw post content to quote
 * @returns {string} Body suitable for a new reply
 */
function buildForwardBody(topicTitle, postUrl, rawContent) {
	const title = topicTitle || '';
	const forwardedHeader = '> ' + (title ? '**Forwarded from** [' + title.replace(/\]/g, '\\]') + '](' + postUrl + ')' : postUrl);
	const quotedContent = (rawContent || '').split('\n').map(line => '> ' + line).join('\n');
	return forwardedHeader + (quotedContent ? '\n' + quotedContent : '');
}

module.exports = function (Posts) {
	Posts.buildForwardBody = buildForwardBody;
};