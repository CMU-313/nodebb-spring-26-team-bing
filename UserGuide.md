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
This feature is highly dependent on manual user testing to check if the flow of the feauture ("Forward post"-> choose topic -> add content -> view forwarded reply) is correct. Therefore the automated test only checks whether or not the reply does indeed contain the forwarded content in the case that a post was forwarded. 


## Verifiable Posts/Answers

## Sorting Posts by Attribute

## Instructor-only Posts
