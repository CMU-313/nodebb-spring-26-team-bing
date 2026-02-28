'use strict';

const assert = require('assert');

const db = require('../mocks/databasemock');

const user = require('../../src/user');
const categories = require('../../src/categories');
const topics = require('../../src/topics');
const utils = require('../../src/utils');

describe('Topic heat sorting', () => {
	let cid;
	let uid;
	let tidA;
	let tidB;
	let tidC;

	before(async () => {
		({ cid } = await categories.create({ name: utils.generateUUID().slice(0, 8) }));
		uid = await user.create({ username: utils.generateUUID().slice(0, 8) });

		({ topicData: { tid: tidA } } = await topics.post({ uid, cid, title: 'Topic A', content: 'A' }));
		({ topicData: { tid: tidB } } = await topics.post({ uid, cid, title: 'Topic B', content: 'B' }));
		({ topicData: { tid: tidC } } = await topics.post({ uid, cid, title: 'Topic C', content: 'C' }));

		const now = Date.now();
		// Make Topic A moderately popular and very recent
		await topics.setTopicFields(tidA, {
			viewcount: 100,
			postcount: 2,
			upvotes: 1,
			lastposttime: now,
		});

		// Make Topic B have more engagement (higher heat despite lower views)
		await topics.setTopicFields(tidB, {
			viewcount: 50,
			postcount: 10,
			upvotes: 5,
			lastposttime: now - (48 * 3600000), // ~2 days ago
		});

		// Topic C is old and low-activity
		await topics.setTopicFields(tidC, {
			viewcount: 10,
			postcount: 1,
			upvotes: 0,
			lastposttime: now - (10 * 24 * 3600000), // ~10 days ago
		});
	});

	it('should return topics ordered by heat', async () => {
		const tids = await categories.getTopicIds({ uid, cid, start: 0, stop: 2, sort: 'heat' });
		assert(Array.isArray(tids));
		assert.strictEqual(tids.length, 3);
		// Expect Topic B (higher engagement) before Topic A, then Topic C
		assert.deepStrictEqual(tids, [String(tidB), String(tidA), String(tidC)]);
	});
});
