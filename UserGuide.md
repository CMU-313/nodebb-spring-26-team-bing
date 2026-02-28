# Features

## Forwarding Posts

## Verifiable Posts/Answers

## Sorting Posts by Heat
Users can now navigate to a category and select "hot" from the sorting dropdown to sort topics by heat which is a function of activity and time

Heat = (views × 1) + (posts × 5) + (upvotes × 20) + (age_decay × 100)

Where:
age_decay = max(0.5, 1 - age_hours / 168)
age_hours = (current_time - last_post_time) / 3600000

Automated tests can be found in test/topics/heat.js which tests for accurate heat score calculation, proper handling of topics with zero, null, or high engagement, prioritizing different modes of activity (upvotes, posts, views), use of age decay, and correct sort order.

## Instructor-only Posts
