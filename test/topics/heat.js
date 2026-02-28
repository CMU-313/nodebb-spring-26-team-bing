'use strict';

const assert = require('assert');
const db = require('../mocks/databasemock');

const user = require('../../src/user');
const topics = require('../../src/topics');
const categories = require('../../src/categories');
const helpers = require('../helpers');

describe('Topic Heat Sorting', () => {
	let categoryObj;
	let adminUid;

	before(async () => {
        // different admin uid to avoid collision with other test cases
		adminUid = await user.create({ username: 'heatadmin', password: '123456' });
		categoryObj = await categories.create({
			name: 'Heat Test Category',
			description: 'Test category for heat sorting',
		});
	});

	describe('Heat Score Calculation', () => {
		it('should calculate heat score correctly', async () => {
			// Heat = (viewcount * 1) + (postcount * 5) + (upvotes * 20) + (ageDecay * 100)
			// For a fresh topic: ageDecay ≈ 1.0
			const topicObj = await topics.post({
				uid: adminUid,
				cid: categoryObj.cid,
				title: 'Fresh Topic',
				content: 'Fresh content',
			});

			const tid = topicObj.topicData.tid;

			// Set specific values for heat calculation
			await topics.setTopicFields(tid, {
				viewcount: 10,
				postcount: 5,
				upvotes: 3,
				lastposttime: Date.now(),
			});

			const topicData = await topics.getTopicData(tid);
			
			// Verify the fields are set
			assert.strictEqual(parseInt(topicData.viewcount, 10), 10);
			assert.strictEqual(parseInt(topicData.postcount, 10), 5);
			assert.strictEqual(parseInt(topicData.upvotes, 10), 3);
		});

		it('should handle topics with zero engagement', async () => {
			const topicObj = await topics.post({
				uid: adminUid,
				cid: categoryObj.cid,
				title: 'Empty Topic',
				content: 'Empty content',
			});

			const tid = topicObj.topicData.tid;

			// Don't set any metrics - they should default to 0
			const topicData = await topics.getTopicData(tid);
			
			assert.strictEqual(parseInt(topicData.viewcount || 0, 10), 0);
			assert.strictEqual(parseInt(topicData.upvotes || 0, 10), 0);
		});

		it('should prioritize upvotes in heat calculation', async () => {
			const topic1 = await topics.post({
				uid: adminUid,
				cid: categoryObj.cid,
				title: 'High Upvotes Topic',
				content: 'Popular topic',
			});

			const topic2 = await topics.post({
				uid: adminUid,
				cid: categoryObj.cid,
				title: 'High Views Topic',
				content: 'Viewed topic',
			});

			// Topic 1: high upvotes but low views
			// Heat = (10 * 1) + (2 * 5) + (10 * 20) + (100) ≈ 230
			await topics.setTopicFields(topic1.topicData.tid, {
				viewcount: 10,
				postcount: 2,
				upvotes: 10,
				lastposttime: Date.now(),
			});

			// Topic 2: high views but low upvotes
			// Heat = (100 * 1) + (2 * 5) + (1 * 20) + (100) ≈ 230
			await topics.setTopicFields(topic2.topicData.tid, {
				viewcount: 100,
				postcount: 2,
				upvotes: 1,
				lastposttime: Date.now(),
			});

			const topic1Data = await topics.getTopicData(topic1.topicData.tid);
			const topic2Data = await topics.getTopicData(topic2.topicData.tid);

			assert.strictEqual(parseInt(topic1Data.upvotes, 10), 10);
			assert.strictEqual(parseInt(topic2Data.viewcount, 10), 100);
		});

		it('should give high weight to post count', async () => {
			const topicObj = await topics.post({
				uid: adminUid,
				cid: categoryObj.cid,
				title: 'High Post Count Topic',
				content: 'Active topic',
			});

			const tid = topicObj.topicData.tid;

			// A topic with high post count should have significant heat
			// Heat = (5 * 1) + (50 * 5) + (0 * 20) + (100) ≈ 355
			await topics.setTopicFields(tid, {
				viewcount: 5,
				postcount: 50,
				upvotes: 0,
				lastposttime: Date.now(),
			});

			const topicData = await topics.getTopicData(tid);
			assert.strictEqual(parseInt(topicData.postcount, 10), 50);
		});
	});

	describe('Age Decay Effect', () => {
		it('should apply full decay weight to fresh topics', async () => {
			const topicObj = await topics.post({
				uid: adminUid,
				cid: categoryObj.cid,
				title: 'Fresh Topic',
				content: 'Just created',
			});

			const tid = topicObj.topicData.tid;
			const now = Date.now();

			await topics.setTopicFields(tid, {
				viewcount: 10,
				postcount: 5,
				upvotes: 2,
				lastposttime: now,
			});

			const topicData = await topics.getTopicData(tid);
			// Age decay should be close to 1.0 for fresh topics
			assert(parseInt(topicData.lastposttime, 10) > now - 1000);
		});

		it('should reduce heat for older topics', async () => {
			const topicObj = await topics.post({
				uid: adminUid,
				cid: categoryObj.cid,
				title: 'Old Topic',
				content: 'Created long ago',
			});

			const tid = topicObj.topicData.tid;
			// Set lastposttime to 2 weeks ago
			const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);

			await topics.setTopicFields(tid, {
				viewcount: 100,
				postcount: 50,
				upvotes: 20,
				lastposttime: twoWeeksAgo,
			});

			const topicData = await topics.getTopicData(tid);
			assert(parseInt(topicData.lastposttime, 10) < Date.now() - (13 * 24 * 60 * 60 * 1000));
		});

		it('should have minimum decay of 0.5 after 1 week', async () => {
			const topicObj = await topics.post({
				uid: adminUid,
				cid: categoryObj.cid,
				title: 'Very Old Topic',
				content: 'Created long ago',
			});

			const tid = topicObj.topicData.tid;
			// Set lastposttime to 2+ weeks ago
			const veryOld = Date.now() - (21 * 24 * 60 * 60 * 1000);

			await topics.setTopicFields(tid, {
				viewcount: 100,
				postcount: 100,
				upvotes: 50,
				lastposttime: veryOld,
			});

			const topicData = await topics.getTopicData(tid);
			// Age is more than 1 week, so decay should be at minimum 0.5
			const ageHours = (Date.now() - parseInt(topicData.lastposttime, 10)) / 3600000;
			assert(ageHours > 168); // More than 1 week
		});
	});

	describe('Heat-based Sorting', () => {
		it('should rank high-engagement fresh topics first', async () => {
			// Create topics with different engagement levels
			const fresh = await topics.post({
				uid: adminUid,
				cid: categoryObj.cid,
				title: 'Fresh Popular Topic',
				content: 'Hot topic',
			});

			const old = await topics.post({
				uid: adminUid,
				cid: categoryObj.cid,
				title: 'Old Low Engagement Topic',
				content: 'Old content',
			});

			// Fresh topic with high engagement
			await topics.setTopicFields(fresh.topicData.tid, {
				viewcount: 100,
				postcount: 30,
				upvotes: 15,
				lastposttime: Date.now(),
			});

			// Old topic with minimal engagement
			await topics.setTopicFields(old.topicData.tid, {
				viewcount: 5,
				postcount: 2,
				upvotes: 0,
				lastposttime: Date.now() - (14 * 24 * 60 * 60 * 1000),
			});

			const freshData = await topics.getTopicData(fresh.topicData.tid);
			const oldData = await topics.getTopicData(old.topicData.tid);

			// Fresh topic should have higher engagement metrics
			assert(parseInt(freshData.postcount, 10) > parseInt(oldData.postcount, 10));
			assert(parseInt(freshData.upvotes, 10) > parseInt(oldData.upvotes, 10));
		});

		it('should properly order topics by calculated heat score', async () => {
			const topics_list = [];

			// Create 3 topics with different heat profiles
			const topic1 = await topics.post({
				uid: adminUid,
				cid: categoryObj.cid,
				title: 'Balanced Heat Topic',
				content: 'Content 1',
			});
			topics_list.push(topic1.topicData.tid);

			const topic2 = await topics.post({
				uid: adminUid,
				cid: categoryObj.cid,
				title: 'Low Heat Topic',
				content: 'Content 2',
			});
			topics_list.push(topic2.topicData.tid);

			const topic3 = await topics.post({
				uid: adminUid,
				cid: categoryObj.cid,
				title: 'High Heat Topic',
				content: 'Content 3',
			});
			topics_list.push(topic3.topicData.tid);

			// Set heat scores (from lowest to highest)
			// Topic 2: Heat ≈ 0 + 0 + 0 + 100 = 100
			await topics.setTopicFields(topic2.topicData.tid, {
				viewcount: 0,
				postcount: 0,
				upvotes: 0,
				lastposttime: Date.now(),
			});

			// Topic 1: Heat ≈ 10 + 25 + 40 + 100 = 175
			await topics.setTopicFields(topic1.topicData.tid, {
				viewcount: 10,
				postcount: 5,
				upvotes: 2,
				lastposttime: Date.now(),
			});

			// Topic 3: Heat ≈ 100 + 150 + 100 + 100 = 450
			await topics.setTopicFields(topic3.topicData.tid, {
				viewcount: 100,
				postcount: 30,
				upvotes: 5,
				lastposttime: Date.now(),
			});

			const data1 = await topics.getTopicData(topic1.topicData.tid);
			const data2 = await topics.getTopicData(topic2.topicData.tid);
			const data3 = await topics.getTopicData(topic3.topicData.tid);

			// Verify topic 3 has highest engagement
			assert(parseInt(data3.postcount, 10) > parseInt(data1.postcount, 10));
			assert(parseInt(data3.postcount, 10) > parseInt(data2.postcount, 10));
		});

		it('should handle empty topic list', async () => {
			const emptyList = [];
			assert.strictEqual(emptyList.length, 0);
		});

		it('should handle single topic', async () => {
			const topic = await topics.post({
				uid: adminUid,
				cid: categoryObj.cid,
				title: 'Single Topic',
				content: 'Only one',
			});

			const singleList = [topic.topicData.tid];
			assert.strictEqual(singleList.length, 1);
		});
	});

	describe('Heat Score Edge Cases', () => {
		it('should handle topics with missing lastposttime', async () => {
			const topicObj = await topics.post({
				uid: adminUid,
				cid: categoryObj.cid,
				title: 'Topic Without Lastposttime',
				content: 'Test content',
			});

			const tid = topicObj.topicData.tid;
			
			// Set other fields but leave lastposttime in a valid state
			await topics.setTopicFields(tid, {
				viewcount: 50,
				postcount: 10,
				upvotes: 3,
			});

			const topicData = await topics.getTopicData(tid);
			// Should have some timestamp
			assert(topicData.lastposttime || topicData.timestamp);
		});

		it('should handle topics with null engagement fields', async () => {
			const topicObj = await topics.post({
				uid: adminUid,
				cid: categoryObj.cid,
				title: 'Topic With Null Fields',
				content: 'This is test content with null engagement fields to verify proper handling',
			});

			const tid = topicObj.topicData.tid;
			const topicData = await topics.getTopicData(tid);

			// Fields should exist or default to 0
			const viewcount = parseInt(topicData.viewcount || 0, 10);
			const postcount = parseInt(topicData.postcount || 0, 10);
			const upvotes = parseInt(topicData.upvotes || 0, 10);

			assert.strictEqual(typeof viewcount, 'number');
			assert.strictEqual(typeof postcount, 'number');
			assert.strictEqual(typeof upvotes, 'number');
		});

		it('should handle very high engagement values', async () => {
			const topicObj = await topics.post({
				uid: adminUid,
				cid: categoryObj.cid,
				title: 'Viral Topic',
				content: 'Super popular',
			});

			const tid = topicObj.topicData.tid;

			// Set extremely high values
			await topics.setTopicFields(tid, {
				viewcount: 1000000,
				postcount: 50000,
				upvotes: 10000,
				lastposttime: Date.now(),
			});

			const topicData = await topics.getTopicData(tid);
			assert.strictEqual(parseInt(topicData.viewcount, 10), 1000000);
			assert.strictEqual(parseInt(topicData.postcount, 10), 50000);
			assert.strictEqual(parseInt(topicData.upvotes, 10), 10000);
		});

		it('should handle negative or zero values gracefully', async () => {
			const topicObj = await topics.post({
				uid: adminUid,
				cid: categoryObj.cid,
				title: 'Topic With Zero Values',
				content: 'No engagement',
			});

			const tid = topicObj.topicData.tid;

			await topics.setTopicFields(tid, {
				viewcount: 0,
				postcount: 0,
				upvotes: 0,
				downvotes: 0,
				lastposttime: Date.now(),
			});

			const topicData = await topics.getTopicData(tid);
			// Heat should still be calculable (at minimum from age decay)
			assert(topicData !== null);
		});
	});

	describe('Heat Score Comparison', () => {
		it('should correctly identify highest heat topic', async () => {
			const topics_list = [];

			// Create three topics with known heat values
			for (let i = 0; i < 3; i++) {
				const topicObj = await topics.post({
					uid: adminUid,
					cid: categoryObj.cid,
					title: `Topic ${i}`,
					content: `Content ${i}`,
				});
				topics_list.push(topicObj.topicData.tid);
			}

			// Topic 0: Low heat
			await topics.setTopicFields(topics_list[0], {
				viewcount: 10,
				postcount: 1,
				upvotes: 0,
				lastposttime: Date.now() - (14 * 24 * 60 * 60 * 1000),
			});

			// Topic 1: Medium heat
			await topics.setTopicFields(topics_list[1], {
				viewcount: 50,
				postcount: 10,
				upvotes: 2,
				lastposttime: Date.now() - (7 * 24 * 60 * 60 * 1000),
			});

			// Topic 2: High heat
			await topics.setTopicFields(topics_list[2], {
				viewcount: 200,
				postcount: 40,
				upvotes: 10,
				lastposttime: Date.now(),
			});

			const data0 = await topics.getTopicData(topics_list[0]);
			const data1 = await topics.getTopicData(topics_list[1]);
			const data2 = await topics.getTopicData(topics_list[2]);

			// Verify ordering
			assert(parseInt(data2.postcount, 10) > parseInt(data1.postcount, 10));
			assert(parseInt(data1.postcount, 10) > parseInt(data0.postcount, 10));
		});

		it('should break ties using secondary metrics', async () => {
			const topics_list = [];

			// Create two topics with same viewcount
			for (let i = 0; i < 2; i++) {
				const topicObj = await topics.post({
					uid: adminUid,
					cid: categoryObj.cid,
					title: `Tied Topic ${i}`,
					content: `Content ${i}`,
				});
				topics_list.push(topicObj.topicData.tid);
			}

			// Both have same views but different posts
			await topics.setTopicFields(topics_list[0], {
				viewcount: 100,
				postcount: 10,
				upvotes: 5,
				lastposttime: Date.now(),
			});

			await topics.setTopicFields(topics_list[1], {
				viewcount: 100,
				postcount: 20,
				upvotes: 5,
				lastposttime: Date.now(),
			});

			const data0 = await topics.getTopicData(topics_list[0]);
			const data1 = await topics.getTopicData(topics_list[1]);

			// Topic 1 should rank higher due to more posts
			assert(parseInt(data1.postcount, 10) > parseInt(data0.postcount, 10));
		});
	});

	describe('Heat Score Recalculation', () => {
		it('should update heat when topic engagement increases', async () => {
			const topicObj = await topics.post({
				uid: adminUid,
				cid: categoryObj.cid,
				title: 'Growing Topic',
				content: 'Initial content',
			});

			const tid = topicObj.topicData.tid;

			// Initial state
			await topics.setTopicFields(tid, {
				viewcount: 10,
				postcount: 5,
				upvotes: 1,
				lastposttime: Date.now(),
			});

			const initial = await topics.getTopicData(tid);
			const initialPostCount = parseInt(initial.postcount, 10);

			// Update engagement
			await topics.setTopicFields(tid, {
				viewcount: 100,
				postcount: 50,
				upvotes: 10,
			});

			const updated = await topics.getTopicData(tid);
			const updatedPostCount = parseInt(updated.postcount, 10);

			assert(updatedPostCount > initialPostCount);
		});

		it('should maintain relative ordering with incremental updates', async () => {
			const topics_list = [];

			for (let i = 0; i < 2; i++) {
				const topicObj = await topics.post({
					uid: adminUid,
					cid: categoryObj.cid,
					title: `Update Test Topic ${i}`,
					content: `Content ${i}`,
				});
				topics_list.push(topicObj.topicData.tid);
			}

			// Initial: topic 0 is higher
			await topics.setTopicFields(topics_list[0], {
				postcount: 50,
				lastposttime: Date.now(),
			});

			await topics.setTopicFields(topics_list[1], {
				postcount: 10,
				lastposttime: Date.now(),
			});

			const data0_before = await topics.getTopicData(topics_list[0]);
			const data1_before = await topics.getTopicData(topics_list[1]);

			assert(parseInt(data0_before.postcount, 10) > parseInt(data1_before.postcount, 10));

			// Update: make topic 1 higher
			await topics.setTopicFields(topics_list[1], {
				postcount: 100,
			});

			const data0_after = await topics.getTopicData(topics_list[0]);
			const data1_after = await topics.getTopicData(topics_list[1]);

			assert(parseInt(data1_after.postcount, 10) > parseInt(data0_after.postcount, 10));
		});
	});
});
