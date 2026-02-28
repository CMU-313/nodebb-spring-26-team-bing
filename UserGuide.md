# Features

## Forwarding Posts

### Purpose
To be able to forward/reference another post as part of a reply to a different topic. Allows for the connection of replies and ideas between topics. 

### Usage
In the Harmony theme, each post has a "Forward post" icon. Pressing this icon will open the reply text-editor with the forwarded post content pre-filled. Along with this text editor there will be a search bar that allows users to search which topic they want to forward the post to. Users can add their own additional text in the text editor along with the forwarded pre-filled content.

### Testing
Step 1: Press "Forward Post" on the post you want to forward.
![img1](https://github.com/user-attachments/assets/c50654c8-e5ae-4414-9cbc-fa6fb89ae487)<br><br>
Step 2: The reply text-editor will appear. Choose a topic to forward to:
![img2](https://github.com/user-attachments/assets/dadd4567-74be-4e82-82e4-208bcf875560)<br><br>
Step 3: Add additional content to the post and press submit <br>
Step 4: View the forwarded post
![img3](https://github.com/user-attachments/assets/6f5d6260-15fc-4a07-8e81-00e5c52e4dd9)

### Automated Testing
Automated tests can be found in test/posts.js on lines 305-349. The test creates two topics: one to forward to and one to forward from. It creates a reply with the forwarded header and additional content, then retrieves the reply and ascertains that the retrieved reply does indeed contain the forwarded post. <br>
Another test ensures that users cannot forward posts to their own topic. This test creates a post in a new topic, and uses the same comparison logic as the implementation code to check if the destination and source topics are identical. If so, it checks if an error was thrown. <br>
This feature is highly dependent on manual user testing to check if the flow of the feauture ("Forward post"-> choose topic -> add content -> view forwarded reply) is correct. Therefore the automated test only checks whether or not the reply does indeed contain the forwarded content in the case that a post was forwarded, and the case that an error is thrown.

## Instructor-Only & Anonymous Posting
### Overview
Students may need to ask instructors questions that require sharing parts of their buggy code. In many CS courses, sharing code publicly (even unintentionally) can result in an Academic Integrity Violation (AIV).<br>
This feature introduces flexible post visibility options to ensure students can:<br>
* Ask questions publicly
* Ask anonymously
* Share posts visible only to instructors

### Posting Options
When creating a post (via New Topic or Quick Reply), users will now see a Visibility dropdown instead of the previous anonymous toggle.


### Visibility Modes
The dropdown includes three options:
1) Post Publicly (default)
  * Visible to all users who can access the topic
  * Author identity is shown normally
2) Post Anonymously
  * Visible to all users
  * Author identity is masked
  * Fully compatible with the existing anonymous system
3) Post to Instructors
  * Visible only to:
    * The post/topic author
    * Administrators (instructors/moderators)
  * Hidden from other students

The selected option is stored as:<br>
visibilityMode = public | anonymous | instructors

### How Instructor-Only Posts Work
Instructor-only posts are restricted at the read level.<br>
Access is granted only if:
* You are the author of the post, OR
* You are an admin/moderator (instructor)


All other users:
* Cannot see the post
* Cannot access its raw content
* Will not see it in topic listings


Instructor-only topics are also filtered out for non-author, non-admin users.

### Anonymous Compatibility
This update preserves full backward compatibility with the existing anonymous posting system:
* The legacy “anonymous” flag still exists
* visibilityMode = anonymous maps internally to the anonymous behavior
* Author masking logic remains unchanged
* Composer logic includes a compatibility fallback to prevent regressions


### Where This Applies
The visibility dropdown appears in:
* New Topic Composer
* Quick Reply Composer


Both composers use the same visibility system.

### Testing Instructions
Build and Run<br>
./nodebb build<br>
./nodebb restart<br>
Run full test suite:<br>
npm test<br>

### Manual Verification
1) Open Quick Reply and confirm the dropdown appears.
2) Confirm default selection is Post Publicly.
3) Create:
    * One Public post
    * One Anonymous post
    * One Instructor-only post
4) Verify:
    * Anonymous posts mask identity
    * Instructor-only posts are visible only to author + admin
    * Regular users cannot see instructor-only posts

## Sorting Posts by Heat
Users can now navigate to a category and select "hot" from the sorting dropdown to sort topics by heat which is a function of activity and time

Heat = (views × 1) + (posts × 5) + (upvotes × 20) + (age_decay × 100)

Where:
age_decay = max(0.5, 1 - age_hours / 168)
age_hours = (current_time - last_post_time) / 3600000

Automated tests can be found in test/topics/heat.js which tests for accurate heat score calculation, proper handling of topics with zero, null, or high engagement, prioritizing different modes of activity (upvotes, posts, views), use of age decay, and correct sort order.

