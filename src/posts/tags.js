'use strict';

module.exports = function (Posts) {
	/**
	 * Add tags to posts
	 * @param {Array<string>} tags - Array of tag names (e.g., ['verified post'])
	 * @param {Array<number>} pids - Array of post IDs
	 */
	Posts.addTags = async function (tags, pids) {
		const db = require('../database');

		const postData = await Posts.getPostsFields(pids, ['pid', 'tags']);
		const bulkSet = [];

		postData.forEach((post) => {
			const postTags = post.tags ? post.tags.split(',').filter(t => t.trim()) : [];
			tags.forEach((tag) => {
				if (!postTags.includes(tag)) {
					postTags.push(tag);
				}
			});
			bulkSet.push([`post:${post.pid}`, { tags: postTags.join(',') }]);
		});

		await db.setObjectBulk(bulkSet);
	};

	/**
	 * Remove tags from posts
	 * @param {Array<string>} tags - Array of tag names to remove
	 * @param {Array<number>} pids - Array of post IDs
	 */
	Posts.removeTags = async function (tags, pids) {
		const db = require('../database');

		const postData = await Posts.getPostsFields(pids, ['pid', 'tags']);
		const bulkSet = [];

		postData.forEach((post) => {
			const postTags = post.tags ? post.tags.split(',').filter(t => t.trim()) : [];
			tags.forEach((tag) => {
				const index = postTags.indexOf(tag);
				if (index !== -1) {
					postTags.splice(index, 1);
				}
			});
			bulkSet.push([`post:${post.pid}`, { tags: postTags.join(',') }]);
		});

		await db.setObjectBulk(bulkSet);
	};

	/**
	 * Get tags for a post
	 * @param {number} pid - Post ID
	 * @returns {Array<string>} Array of tag names
	 */
	Posts.getTags = async function (pid) {
		const post = await Posts.getPostFields(pid, ['tags']);
		return post.tags ? post.tags.split(',').filter(t => t.trim()) : [];
	};

	/**
	 * Check if a post has a specific tag
	 * @param {number} pid - Post ID
	 * @param {string} tag - Tag name
	 * @returns {boolean}
	 */
	Posts.hasTag = async function (pid, tag) {
		const tags = await Posts.getTags(pid);
		return tags.includes(tag);
	};

	/**
	 * Check if a post is verified (has 'verified post' tag)
	 * @param {number} pid - Post ID
	 * @returns {boolean}
	 */
	Posts.isVerified = async function (pid) {
		return await Posts.hasTag(pid, 'verified post');
	};

	/**
	 * Clear all tags from posts
	 * @param {Array<number>} pids - Array of post IDs
	 */
	Posts.clearTags = async function (pids) {
		const db = require('../database');
		await db.setObjectsField(pids.map(pid => `post:${pid}`), 'tags', '');
	};
};
