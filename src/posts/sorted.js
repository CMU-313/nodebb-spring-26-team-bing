/* eslint-disable @stylistic/js/indent */
'use strict';

const _ = require('lodash');

const db = require('../database');
const privileges = require('../privileges');

module.exports = function (Posts) {
	const terms = {
		day: 86400000,
		week: 604800000,
		month: 2592000000,
	};
    
	Posts.getRecentPosts = async function (uid, start, stop, term) {
		let min = 0;
		if (terms[term]) {
			min = Date.now() - terms[term];
		}
    
		const count = parseInt(stop, 10) === -1 ? stop : stop - start + 1;
		let pids = await db.getSortedSetRevRangeByScore('posts:pid', start, count, '+inf', min);
		pids = await privileges.posts.filter('topics:read', pids, uid);
		return await Posts.getPostSummaryByPids(pids, uid, { stripTags: true });
	};
    
	Posts.getRecentPosterUids = async function (start, stop) {
		const pids = await db.getSortedSetRevRange('posts:pid', start, stop);
		const postData = await Posts.getPostsFields(pids, ['uid']);
		return _.uniq(postData.map(p => p && p.uid).filter(uid => parseInt(uid, 10)));
	};

	Posts.getMostComments = async function (uid, start, stop, term) {
		let min = 0;
		if (terms[term]) {
			min = Date.now() - terms[term];
		}

		// Fetch a larger set to account for filtering by privileges
		// We'll fetch more than needed, sort, then slice
		const count = parseInt(stop, 10) === -1 ? stop : Math.max(stop - start + 1, 100) * 2;
		let pids = await db.getSortedSetRevRangeByScore('posts:pid', 0, count, '+inf', min);
		pids = await privileges.posts.filter('topics:read', pids, uid);
		
		// Get post data with reply counts
		const postData = await Posts.getPostsFields(pids, ['pid', 'replies', 'timestamp']);
		
		// Sort by reply count (descending)
		postData.sort((a, b) => b.replies - a.replies);
		
		// Apply pagination after sorting
		const sortedPids = postData.slice(start, stop + 1).map(p => p.pid);
		
		return await Posts.getPostSummaryByPids(sortedPids, uid, { stripTags: true });
	};

	Posts.getMostVotes = async function (uid, start, stop, term) {
        let min = 0;
		if (terms[term]) {
			min = Date.now() - terms[term];
		}

        const count = parseInt(stop, 10) === -1 ? stop : stop - start + 1;
		let pids = await db.getSortedSetRevRangeByScore('posts:pid:votes', start, count, '+inf', min)
	};

    Posts.calculateHeat = function (post) {
        const age = Date.now() - post.createdAt;
        return post.replies / (age || 1);
    };

	Posts.getHotPosts = async function (uid, start, stop, term) {
        let min = 0;
		if (terms[term]) {
			min = Date.now() - terms[term];
		}
	};
};