'use strict';

const nconf = require('nconf');
const querystring = require('querystring');

const meta = require('../meta');
const posts = require('../posts');
const privileges = require('../privileges');
const activitypub = require('../activitypub');
const utils = require('../utils');

const helpers = require('./helpers');

const postsController = module.exports;

postsController.redirectToPost = async function (req, res, next) {
	const pid = utils.isNumber(req.params.pid) ? parseInt(req.params.pid, 10) : req.params.pid;
	if (!pid) {
		return next();
	}

	// Kickstart note assertion if applicable
	if (!utils.isNumber(pid) && req.uid && meta.config.activitypubEnabled) {
		const exists = await posts.exists(pid);
		if (!exists) {
			await activitypub.notes.assert(req.uid, pid);
		}
	}

	const [canRead, path] = await Promise.all([
		privileges.posts.can('topics:read', pid, req.uid),
		posts.generatePostPath(pid, req.uid),
	]);
	if (!path) {
		return next();
	}
	if (!canRead) {
		return helpers.notAllowed(req, res);
	}

	if (meta.config.activitypubEnabled) {
		// Include link header for richer parsing
		res.set('Link', `<${nconf.get('url')}/post/${req.params.pid}>; rel="alternate"; type="application/activity+json"`);
	}

	const qs = querystring.stringify(req.query);
	helpers.redirect(res, qs ? `${path}?${qs}` : path, true);
};

postsController.getSortedPosts = async function (req, res) {
	const sort_method = req.query.sort || 'recent';
	const page = parseInt(req.query.page, 10) || 1;
	const postsPerPage = 20;
	const start = Math.max(0, (page - 1) * postsPerPage);
	const stop = start + postsPerPage - 1;
	switch (sort_method) {
		case 'recent': {
			const data = await posts.getRecentPosts(req.uid, start, stop, req.params.term);
			return res.json(data);
		}
		case 'most-comments': {
			const data = await posts.getMostComments(req.uid, start, stop, req.params.term);
			return res.json(data);
		}
		case 'most-votes': {
			const data = await posts.getMostVotes(req.uid, start, stop, req.params.term);
			return res.json(data);
		}
		case 'hot': {
			const data = await posts.getHotPosts(req.uid, start, stop, req.params.term);
			return res.json(data);
		}
		default:
			return res.status(400).json({ error: 'Invalid sort method' });
	}
};
