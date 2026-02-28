# Features

## Forwarding Posts

## Verifiable Posts/Answers

## Sorting Posts by Attribute

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

