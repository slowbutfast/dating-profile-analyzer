Section 1:  Introduction

1.1 Project Specific Details
[Exercise] Answer these questions:
Project name;
Team members (include cs logins) and division of labor; and
Include the total estimated time it should take to complete the project. (Be aware of the available timeline before the semester ends, and try to give a rough weekly budget. As the project progresses, return to your budget and re-evaluate with your mentor.)

Our final project, Dating Profile Analyzer, will be completed by our team: Chris Zhang (czhan291), Greg Lazatin (glazatin), and Aaron Martin (amart172). Chris will primarily focus on the frontend/View module, including the upload interface, results dashboard, and overall user experience. Greg will lead work on the backend/Controller and Data Persistence modules, implementing the API endpoints, authentication, and database integration. Aaron will take primary responsibility for the Model/Analysis modules, including integrating the LLM text analysis and computer-vision image analysis, as well as coordinating user research and evaluation. We expect the project to take roughly 90–105 person-hours in total (about 30–35 hours per team member), spread over the remaining weeks of the semester. This corresponds to an estimated commitment of 5–7 hours per person per week, which we will revisit and refine with our mentor as we get feedback and a clearer sense of implementation complexity.

1.2 Purpose 
In this section, you’ll outline why this project matters, to you and others. What problem(s) does it attempt to solve? Imagine you’re proposing this project to a boss or a grant board, and want them to feel like this project is deserving of their resources. You should assume your audience isn’t familiar with the exact problem you’re solving; make sure to give context. 
[Exercise] Write up a description of your project, using the questions below as a guide. Remember to answer in paragraph form. 
What problem does your project try to solve?
Specify how you gathered knowledge about the problem (e.g., user interviews, scholarly articles, the news, personal experience, etc.)
Who does this problem affect? How?
Be specific. Is it an occupation, an age group, a nationality, a racial group? A group of your friends? You, personally? It will likely be a combination of categories.
Note: this group may align more or less directly with your intended user(s).
Why and how does your project help solve this problem?
List at least one alternative solution, whether software-based or not. Why not choose that approach? Valid reasons include your specific skill set, relative cost, greater efficiency, etc.
Broadly, how will the project add value? Examples: makes a process more efficient, accurate, and/or reliable; expands access to a good or service; and/or brings people pleasure/fun.
Why choose to solve this problem over others?
What is your motivation for choosing this project? “General interest” is not a valid reason. Instead, share why this problem interests you. Examples: personal experiences; the problem affects a lot of people; the problem affects a particularly vulnerable group; no one has worked on this issue before; profitability of this area, etc.
In other words, specify why your project is worth doing as one possible solution to the problem.
What acronyms or definitions do you need to define for your project?
Your design process may require defining new terms or acronyms. For instance, you might have specific names for different kinds/tiers of user, or domain-specific concepts that are important to your stakeholders. Define them here.

	Creating an effective dating profile is unexpectedly hard. One doesn’t know what aspects of themselves to highlight, what photos to include, what to write, and how the entirety of the profile comes across to others. The problem our project will address is the lack of accessible, honest, and actionable feedback for people trying to improve their dating profiles without undue embarrassment or financial cost. To thoroughly understand this problem, we drew on conversations with friends who actively use dating apps, observations from online discussion forums where people ask strangers to review their profiles (r/SwipeHelper) and research into existing paid feedback services. The issue affects a broad demographic, from young adults who are creating their first profiles to older adults returning to dating, and everyone in between who feels uncertain or anxious about presenting themselves authentically and effectively. Indirectly, the issue also affects the support system of dating app users such as coaches or therapists, as well as stakeholders working for dating app companies themselves such as content moderation or product teams.
	Our product provides a solution by creating a web app that analyzes a user’s full dating profile including both photos and written responses to offer structured, metric-based feedback. The system uses computer-vision models to score images on dimensions like friendliness, clarity, lighting quality, and social context, and uses a carefully prompted language model to evaluate textual responses on warmth, humor, clarity, and conversation potential. The application then returns actionable insights in an intuitive UI so users can iterate on their profiles quickly and privately. Existing solutions include relying on friends or online forums, hiring a dating coach, or pasting content into general purpose LLMs; these alternatives lack privacy, are expensive, or aren’t specifically tailored to give unbiased, consistent and specific feedback. Our approach offers greater efficiency and reliability by offering both quick automated analysis and focused feedback tailored for dating profile optimization. 
	Among possible problems we could have chosen to solve, we selected this one because it affects a very large population, is poorly addressed by existing tools, and aligns with our group’s technical strengths and interests in frontend design and computer vision. Additionally, each of us has firsthand experience or observations of peers struggling with profile creation, making the project personally motivating for us. We could realistically imagine wanting to use this tool ourselves. Through that practical connection, we feel we have the empathy for the end user and the excitement to build something that could improve a common and stressful task. 
	For clarity in our design process, we will define several terms. CVI Metrics (computer vision image metrics) refers to the set of ratings derived from features we will extract from user photos. LLM Metrics refers to the attributes we assign to written content. Profile Bundle will refer to the user’s full set of inputs that will be passed through the analysis. The Feedback Report is the final output containing scores, explanations, and suggestions. These definitions ensure we share a common language as we design and discuss the system.
	

1.3 Intended Audience and Intended Use 
In this section you’ll outline who will ultimately use your product, and therefore whose desires, concerns, and feedback will be central to your design and development process. This will be expanded on in the later section on user research. 
[Exercise] List your intended end-users.
What parameters define the space of potential users, and how did you choose the “values” of those parameters?
How will the app fit into the lives of your users? How often will they use it?
Is it for personal use or professional use?

Our intended end-users are people who actively use dating apps and want to improve how they present themselves through photos, written responses, or any audio prompts. This will include adults building a profile for the first time, individuals re-entering the dating scene and any users who feel uncertain or anxious about the way they are presenting themselves on these apps. 
The space of potential users is defined by several parameters. One is dating app engagement. Our tool is relevant only to people who currently use or intend to use a dating app. The second parameter is technology ability. We target users who are comfortable uploading photos and text to a web interface. A third is motivation for improvement, we want people who actively desire feedback and are willing to iterate towards an ideal profile. We chose these parameters based on informal interviews, observations from online communities and our own experiences. 
The app is designed to fit into users’ existing dating routines. Most people will use it in bursts such as when first creating a profile, after a period of poor match activity, when making any changes to the profile or when returning to apps after a break. Usage may be sporadic as users might spend 10-20 minutes uploading, iterating, and reviewing feedback, and only return when they need another round of help. 
The app is designed for personal use. Users want private feedback about how they present themselves online, and our tool works to boost their profile. 

[Exercise] Consider the other users and stakeholders outside your intended audience. How do you intend to account for them in your project design?

Beyond our intended end users, some secondary users or stakeholders may interact with or be affected by our project, which we plan to account for in our design. Dating coaches/consultants may use the app as a supplemental tool or recommend it to clients. We will design our interface to present feedback in a manner as transparent and interpretable as possible to allow these professionals to incorporate it responsibly. Mental health professionals may have concerns about self-esteem or body image effects on their patients, so we will take care to use supportive framing, positive suggestions and clear disclaimers that emphasize growth. We also have tailored our metrics to be easily changeable on the users side, and not centered around sources of insecurity like appearance but on presentation concepts like lighting or demeanor. Dating app companies are another important stakeholder, and since our tool influences their platforms we intend to preserve privacy and not store unnecessary personal data to minimize compliance issues. We also think researchers or content moderation teams could find our metrics informative, so we create an optional opt-in to preserve data that could be interesting to these teams. By accommodating these stakeholders we ensure our tool remains socially responsible.

1.4 Scope and User Stories 
In this section, you’ll clearly define your product’s scope, setting guardrails to prevent taking on too much. You’ll do this by detailing the “user stories” your product will fulfill (i.e., the general pieces of functionality your app provides, phrased in the same way they were in the sprints: “as <role> I can <action> so that <context>”, along with acceptance criteria as appropriate). You’ll also detail some user stories you’re not planning on implementing. Don’t overpromise, but remain aware of the potential needs of future development phases (even if those phases can’t happen in the context of the course).
[Exercise] What are you not planning on implementing?
What are some features your users (whether your targeted users, or others) want that are outside your project scope? You can always implement these if you have time, but set them aside for now. At least you’ve written them down, and can keep them in mind when designing your product (or come back to them later).


While our core project centers on analyzing users’ dating profiles and providing structured feedback, we will exclude several overambitious features from our project scope. Many users might want real-time coaching or chat-based advice, but implementing live systems or asynchronous messaging would significantly increase backend complexity and is unnecessary for our minimum viable product. We are also not planning to build any automated profile rewriting tools even though users may request this, because our focus is on analysis, not creation. In the same vein, photo editing or enhancement like retouching or color correction is out of our planned scope due to both ethical concerns and technical burden.

[Exercise] List all your planned user stories, as completely as possible.
These may change slightly throughout the project, in consultation with your mentor. The more careful you are about enumerating them now, the easier it will be to both implement them and to pivot if necessary.
It would be helpful if, along with each user story, you referred to the pertinent user need in the following section. 
We ask you to list user stories first for ease of administration, since those form “acceptance criteria'' for your project. You’ll present progress to your mentor weekly in terms of these user stories!


User Story 1 — Upload Profile Bundle (Images + Text)

User Need: Users want a private, easy way to upload their dating profile materials without feeling embarrassed or overwhelmed.
Story:
“As a user, I can upload a set of images and text responses (‘profile bundle’) so that the system can analyze my full dating profile.”
Acceptance Criteria:
The user can upload multiple images (minimum 3, maximum 10).
The user can upload or paste text responses (minimum 1 required).
Files must be validated for size and type; errors shown clearly if invalid.
The upload succeeds and the user sees a confirmation.
All uploaded data is stored securely under the user’s authenticated account.

User Story 2 — Analyze Images Using CV Metrics

User Need: Users want objective, structured feedback on how their photos are perceived.
Story:
“As a user, I can submit photos and receive feedback on visual metrics (e.g., friendliness, clarity, lighting, eye contact) so that I understand how my pictures come across.”
Acceptance Criteria:

The CV pipeline returns consistent scores across 6–7 predefined metrics.
The results include both numeric scores and short plain-language interpretations.
Errors due to corrupt images or unprocessable files are reported gracefully.
No faces besides the user’s are labeled or identified in group photos.

User Story 3 — Analyze Text Using LLM Metrics

User Need: Users want to know if their written responses seem warm, confident, humorous, etc.
Story:
“As a user, I can receive an LLM-based analysis of my written responses so that I understand their tone and effectiveness on a dating profile.”
Acceptance Criteria:

The LLM outputs a set of text metrics (e.g., warmth, humor, clarity, originality).
The feedback includes concise advice on strengths and weaknesses.
Cliché detection and grammar evaluation run reliably.
Errors (e.g., empty text input) are reported clearly.

User Story 4 — View Consolidated Feedback Report

User Need: Users want actionable, non-judgmental guidance presented clearly in one place.
Story:
“As a user, I can view a consolidated feedback report combining image analysis and text analysis so that I can quickly understand what to improve.”
Acceptance Criteria:

The report displays both image-metric results and text-metric results.
The report includes at least 3 specific improvement suggestions.
The UI is readable and mobile-friendly.
Users can download or re-open past reports stored under their account.

User Story 5 — User Authentication and Data Privacy

User Need: Users want their dating materials to remain private and accessible only to them.
Story:
“As a user, I can create an account, log in, and log out so that my uploaded content and analysis results remain private and associated with me.”
Acceptance Criteria:

Users can sign up with email + password.
Users can log in and log out securely.
Feedback reports and uploads persist across sessions.
Logging out prevents access to private data until logging back in.
Passwords are stored securely (hashed).

User Story 6 — Delete Profile Data

User Need: Users may want to remove their data after receiving feedback.
Story:
“As a user, I can delete my uploaded photos, text, or entire profile bundle so that I remain in control of my privacy.”
Acceptance Criteria:

Users can delete individual items or the entire profile.
Deletions are permanent and reflected immediately.
Feedback reports associated with deleted data are removed.

User Story 7 — Optional Research Contribution (Opt-In Data Sharing)

User Need: Some users may want to contribute anonymized data to help improve the system or support research on dating profile design, but only with explicit consent.
Story:
“As a user, I can explicitly opt in to anonymously share my analysis metrics for research so that I can contribute to improving the system and supporting broader insights without compromising my privacy.”
Acceptance Criteria:
During onboarding or in settings, the user is presented with a clear opt-in toggle (default: off).
The interface explains what data is shared, how it will be anonymized, and how it will be used.
No raw images, text content, or identifiable information are ever shared—only aggregated or anonymized metrics.
The user can opt out at any time, and all future data collection stops immediately.
Opting out does not delete previously contributed anonymized data (this is clearly disclosed).
The feature must be transparent and GDPR-style compliant (e.g., explicit consent required).

Section 2: Overall Description
2.1 User Needs 
Researching user needs is a great opportunity to confirm that your product solves an existing and significant problem. For that reason, you never ask leading questions (e.g., “How do you usually find recipes for cooking? Would you be interested in using an app for that?”). This will bias user answers toward confirming your idea is valid. It’s better to realize you’re fulfilling a non-existent or insignificant need before starting a project than after putting hundreds of hours of work into it.
User research might involve interviews, general research, or consulting experts. From your research, you should gather a list of concrete needs your intended audience has and how your product will help address those needs.
[Exercise] Brainstorm questions for your user research. These questions are guides! Adapt them as appropriate for your project.
What are the most important tasks your users have to perform in the context of your product? 
How often do users perform tasks in the context of your project (i.e., how often will they use the product)?
What are the biggest gaps in current tools used by your users?
In what context will users interact with your product?
Are there secondary users? Do they have different needs?

These questions are meant to be asked in interviews with primary users (people with dating apps), and secondary users (dating coaches or friends they ask for help)
Understanding Current Profile Management & Needs
When you feel your dating profile isn't performing as well as you’d like, what steps do you typically take to try and improve it?
How often do you actively log in to make changes to your existing profile (e.g., swap photos, update a prompt answer)?
What are the top 2–3 qualities or impressions you most want to convey to a potential match through your text and photos?
Gaps in Existing Tools & Feedback
What is the most frustrating or difficult part about choosing which photos to use on your profile?
When you write your profile text (bio, prompts), what kind of feedback or advice do you wish you had access to, but can't easily get?
Can you describe a time you asked a friend, family member, or a dating expert for feedback? 
What was the most valuable part of that experience, and what were the biggest drawbacks?
When you see a profile photo, what makes you immediately swipe right (or left)?
What are the objective qualities you notice first (e.g., lighting, expression, activity)?
Questions for Secondary Stakeholders
As an expert, what repetitive, time-consuming parts of the profile review process do you feel could be streamlined or automated?
What is the single most common mistake clients make regarding their profile text that you have to correct?
What are the three most critical, non-negotiable elements you look for when evaluating a client’s set of profile photos?

[Exercise] Based on your research, consider how what you’ve learned about your user base will help you design your project. These questions are guides!
Does your project create user needs that didn’t exist before?
Is your project trying to solve a non-existent or insignificant problem?
Did you learn something new about your users that clarifies part of your project?
What about your project should change to better suit the needs of your users?

This section requires asking our questions to potential users (people with dating profiles) and maybe nonpotential users

Based on our research, we learned that our project addresses real, existing user needs rather than creating new ones. An article by Hancock & Toma shows that users consistently choose inaccurate or suboptimal photos of themselves, which confirms that people genuinely struggle with selecting effective images for dating profiles. This means our project is not solving an insignificant problem but rather it responds to a well-documented challenge that users face. Research on self-presentation in dating apps (Degen et al., 2021) also revealed that users care about signaling traits such as authenticity, friendliness, sociability, and trustworthiness, often through natural lighting, clear facial visibility, appropriate context, and genuine expressions. This helps clarify that our tool should not focus on subjective judgments like “attractiveness,” but instead on measurable things that users intentionally try to communicate. Pew Research data also shows that many dating app users feel uncertain about whether their profiles are effective, meaning that users want clearer guidance and objective feedback. As a result, we wanted to focus our design to emphasize actionable, privacy-conscious metrics, such as lighting, blurriness, eye contact, face visibility, and text clarity. 
1. “Putting Your Best Face Forward: The Accuracy of Online Dating Photographs” — Hancock & Toma
https://socialmedialab.sites.stanford.edu/sites/g/files/sbiybj22976/files/media/file/hancock-cr-putting-your-best-face-forward.pdf
2. “Profiling the Self in Mobile Online Dating Apps” — Degen et al.
 https://pmc.ncbi.nlm.nih.gov/articles/PMC7881319/
3. Pew Research Center — Key Findings About Online Dating in the U.S.
 https://www.pewresearch.org/short-reads/2023/02/02/key-findings-about-online-dating-in-the-u-s/
2.2 Assumptions
In this section, you’ll outline the assumptions—both technical and non-technical—you’re making in designing your project.
[Exercise] Make a list of any assumptions (technical or otherwise) that you’re making.
Take a look at the list you wrote:
Think about what you learned during your user research. Do your findings align with or support your assumptions? Do they contradict each other completely?
Which user groups are centered? Why?
What are these assumptions based on? Facts? Gut feelings?
What possible harm could be enacted based on your assumptions?

Technical Assumptions:
Users will be willing to upload their photos and text into our app.
Image-processing models (e.g., face detection, blur detection) will reliably detect features like lighting, eye contact, facial visibility, and group photos.
LLMs can provide consistent and actionable feedback on textual profile responses.
Users will have an internet connection and a modern device capable of handling file uploads.
Our webapp interface is accessible for our target users.


Non-Technical Assumptions:
Users want objective, actionable feedback on dating profile quality.
Users struggle to choose strong photos and write compelling text on their own.
Users trust automated feedback more than asking friends or hiring a coach.
Dating profile quality influences match success, so users are motivated to improve it.
People value metrics like authenticity, clarity, friendliness, and photo quality more than subjective attractiveness scores.
Our research mostly supports our assumptions. Studies show that most people tend to choose the wrong pictures of themselves showing that this is a real problem people struggle with. In addition, research on self presentation emphasizes the importance of measurable cues like naturalness and authenticity which matches our assumption that the objective metrics matter. Lastly, research also shows that many people struggle with how to present themselves, which supports our belief that people need clearer guidance. 

One thing that might be weaker is the assumption that users trust automated feedback more than asking friends or hiring a coach. Users might be cautious of uploading photos and text that may contain sensitive information and would rather go to their friend for help.

We are targeting user groups that are active dating users who may feel anxious about their dating profile and want to improve their profile. 

Some potential harm is that we might introduce bias and reinforce beauty norms. We might be favoring certain lighting or certain poses because they are trained on that even though the pictures could be good in different ways. This could also create a false sense of objectivity especially if the user believes that the model is completely accurate. 

2.3 Dependencies
[Exercise] Use this space to think about what your project needs to function. Consider these questions:
What software and other technology does your project rely on?
What non-technical dependencies does your project rely on?
Are you relying on the legality of collecting certain data from your users?
Does the relevance of your app rely on a social and/or cultural context? 
Are there financial dependencies for your project?
Technical/Software Dependencies
While we haven’t selected the specific technical/software dependencies for the project, we’ve outlined the various dependency categories that we’ll use.
Frontend Stack:
Web framework (React, Vue, or similar)
Image upload & preview libraries
UI component library (Material-UI, Tailwind, etc.)
Authentication library (Auth0, Firebase Auth)
Backend Stack:
Server framework (Node.js/Express, Python/FastAPI, etc.)
Database (PostgreSQL, MongoDB, etc.)
File storage solution (AWS S3, Google Cloud Storage, local file system)
LLM API access (OpenAI API, Claude API, or open-source models)
Computer vision models/APIs (Google Vision, AWS Rekognition, TensorFlow-based models, or OpenCV)
Infrastructure:
Hosting platform (AWS, Google Cloud, Heroku, DigitalOcean, Vercel, etc.)

Section 3: System Features and Requirements
Remember to answer the exercises in paragraph form.

3.1 Module Design
In this section you’ll describe the modules (i.e., pieces) of your program, that define the different feature requirements for your project. Let your user stories guide you and define components that will combine to fulfill each user story. Keep in mind what each individual person on your team will work on, and try to avoid having more than one or two people involved in each.

An easy way of breaking down modules is with the model-view-controller software pattern:
The Model is the central component of the pattern. It is the application's dynamic data structure(s), independent of the user interface. This is where data is stored and computation is performed. 
The View is any representation of information. This could be the webpages of your application where the results of computations in the model are displayed. 
The Controller mediates between the Model and the View, based on user input or settings. It passes commands to the Model and updates the View (possibly after some post-processing).
(You can find good discussion of the MVC concept in the CS 0200 notes.)

[Exercise] Outline the project at a high-level. (These questions are guides!)
Which data do you wish to collect and store? What will you use it for?
Will your app communicate with external software? If so, which ones?

Module Design
The dating profile analyzer will be outlined using the model-view-controller pattern, supplemented by a dedicated data layer. The View Module handles all user interface elements, including input forms for profile text and image uploads, and the responsive dashboard used to display the final analysis results. User interaction begins in the View and sends raw data to the Controller Module. 

The Controller will manage user sessions and authorization. It takes the raw inputs from the View and routes them to the Model/Analysis Modules, which acts as the brain of the project. This brain is split into a Text Analysis component (for the LLM API) and an Image Analysis component (for the CV API) that generates the metrics and advice. The entire application relies on communication with external software: a Large Language Model (LLM) API and a Computer Vision (CV) Model API for all processing. 

Once the analysis is complete, the Controller aggregates the resulting metrics and advice, sending it to the Data Persistence Module. This final module provides the secure layer responsible for saving and retrieving all user data, including the raw profile inputs and the final generated analysis results, ensuring data is persistent and private across sessions.

[Exercise] Outline each module of your project. (These questions are guides!)
Each module should have a name and an explicit description. 
Is the module part of the Model, the View, or the Controller?
If it’s part of the View or Controller, how are you going to make this module accessible for the user interacting with it? Describe what these interactions look like.
If it’s part of the Model, which data or processing does it represent? (E.g., is this a wrapper for a recommendation algorithm, a database that stores data scraped from the internet, etc. ?)
How does it communicate with the other modules? (Defining a good interface here will allow you to use mocking to make concurrent progress! Keep in mind that “interfaces” aren’t always Java or TypeScript interfaces; they can be e.g. API protocols etc.)
View Module
This module handles all aspects of the user interface (UI), including authentication screens, the profile upload form, the loading indicator during analysis, and the final dashboard that displays the analysis results.
User Interaction and Accessibility
Users interact with this module directly via the web browser. Key interactions include, login/registration, input form (a page allowing users to paste profile text and upload up to six images) and a results dashboard (a responsive view that presents the metrics like clarity or lighting in a visually clear format like graphs or gauges alongside the detailed text advice)
In terms of its relationship to other modules, it’ll send data to the controller module (user input data and requests) and it receives data from the controller module (authentication status and final structured analysis results).
Controller Module
This module contains all the system logic and connects each module together. It receives requests from the View, routes data to the correct model components for processes, and packages the final results and sends them back to the View and stores them in the database. It also manages user sessions and access control.

This module is accessed indirection via the View through a RESTful api. The user never interacts with it directly.

In terms of its relationship to other modules, it receives data from View module (e.g. raw text, images, user ID) and sends data to text analysis module and image analysis module, as well as the data persistence module.
Model/Analysis Modules
Text Analysis Module (LLM Wrapper)
This module is responsible for sending the user's profile text to an external Large Language Model (LLM) API with a highly specific system prompt. It extracts metrics (e.g., warmth, humor, grammar) and long-form advice.

It wraps the external LLM API, handling authentication, request formatting, and processing the LLM's structured JSON response into a usable format.

In terms of its relationship to other modules, it receives data from the controller (raw text) and sends data back to the controller module.
Image Analysis Module (CV Wrapper)
This module takes the uploaded images and submits them to an external Computer Vision (CV) Model API to assess technical and social features (e.g., face presence, lighting, blurriness, group size).

It handles image preprocessing, calls the external CV model, and standardizes the output for each image into a list of metrics.

In terms of its relationship to other modules, it receives data from controller module (list of image files/URLs), and sends data to controller module (structured image analysis results).

Data Persistence Module (Storage)
This module provides secure, persistent storage for user accounts, raw profile inputs, and all generated analysis results using a cloud database (like Firestore). It ensures user data is private and retrievable across sessions.

It manages database connections, authentication rules, and provides standard CRUD (Create, Read, Update, Delete) operations. The user does not interact with this module directly; it is accessed only by the controller. In terms of its relationship to other modules, it sends and receives data from the controller module.

3.2 Data Requirements
Consider the modules that relate to storing data and computation. By now, you may have an idea of what kinds of data you wish to collect.
[Exercise] Write out each datum you wish to collect. These questions are guides!
What process of consent will you provide your user when collecting this data from them?
What do you want this data for? If you couldn’t gain access to it, would your software still work?
Is this data being stored, but not used? If so, why collect it at all?
Is any of the data publicly available?

Data Collection and Consent 
Raw User Profile Data
We’re also going to collect profile text (bio, prompts) and profile images (up to six files). This is the main data input for the computational models. The text is sent to the LLM for metrics (warmth, humor), and images are sent to the CV model for technical and social metrics (lighting, eye contact). The software is non-functional without this data. We’re going to make users click a checkbox to explicitly give their consent to securely send their data to an external LLM/CV model API for analysis and private storage.
Generated Analysis Results
We’re gonna collect analysis results (like metrics, scores, and detailed advice) for authenticated users which will be useful for data privacy and persistence, allowing users to securely save and review their analysis history across sessions. Consent into this service will be bundled with consent for uploading user profile data.

[Exercise] Write out each module that handles data. These questions are guides!
Is this module storing data, or processing it?
How will you ensure that the collecting, storing, and processing of data is secure?
Data Handling for Each Module
Controller Module
The controller’s role is primary data processing and initial collection of raw user profile data and packages it for the analysis modules. It will also aggregate the generated analysis results before passing to storage and display. We’ll make sure that data is secure in transit by enforcing HTTPS/TLS encryption for all client-server communication. 
Data Persistence Module
Like the name implies, this module will handle storing data, specifically both raw user profile data, and generated analysis results. Storage is made possible by securely associating all data with an authenticated User ID. We’ll also implement strict, user-specific database security rules so that users can’t read or modify data that doesn’t belong to their account
Text and Image Analysis Modules
Both these modules will process data, taking raw profile text and images, submitting them to external LLM or CV model API, and finally generate the text or image portion of the generated analysis results. We’ll communicate with these external APIs via HTTPS/TLS and use secure API keys (stored in environment variables) for authorization, limiting the exposure of raw data during processing.

3.3 Risks
In this section, you’ll identify the key risks your app creates for users, external stakeholders, and the project itself. If there are risks you deem necessary to take, we want you to explain why! We also want you to recognize larger social, economic, and political risks that contextualize the project you’re pursuing. Where does your work fit into this context?

[Exercise] Write out a list of risks that could come from your project.
Is there a security risk related to the data you collect and store? What is it caused by? How can you mitigate this risk? (Remember that metadata can also carry risks.)
Are there accessibility risks involved in the kind of presentation or interaction you will provide? E.g., are you concerned about repetitive stress caused by your UI design, or about the way your page works making it difficult for users to employ screen readers or magnifiers?How can you adjust the design of your View to account for this accessibility need and others?
Project Risks
Security and Data Risks
The first security risk we have to keep in mind are data breaches/leakages. These would be caused by weak database access controls, compromised API keys, or vulnerabilities allowing unauthorized access to users’ raw profiles (images/text) or analysis history. We’ll try to mitigate this risk by implementing strict, user-specific security rules in the data (e.g., Firestore rules) to ensure users can only access their own data. We’ll also use HTTPS/TLS encryption for all data transmission and store all external API keys security in environment variables.

The second risk we need to consider in this category is external API data retention. This would be caused by the third-party LLM or CV model vendor logging or retaining the sensitive raw user data beyond the analysis time, increasing the risk of external exposure. We’ll mitigate this by clearly stating this risk in the user consent form. We’ll design the Controller to use minimal data payloads and utilize any API configurations that explicitly request non-rentention or immediate deletion of submitting data after processing.

This third data risk we’ll have to deal with is metadata leakage. When users upload images, they’ll contain identifiable metadata, like geographic location from EXIF data or original file names. We’ll mitigate this by stripping all non-essential metadata from images and text upon upload before storage or transmission to external processing APIs.
User Experience and Accessibility Risks
When users use our app, the first risk they might encounter is the negative psychological impact caused by the algorithmic feedback or subjective metrics that we turn, which may be interpreted as overly critical or personal. We’ll try to mitigate this by framing all feedback constructively and using encouraging language as well as avoiding simple, definitive failure grades. We’ll also include a prominent disclaiming stating that the AI-generated results are subjective and for guidance only.

We also need to keep in mind accessibility barriers caused by a reliance on custom visual elements (e.g., graphs or gauges) in the results dashboard that make the page difficult for users who rely on screen readers. We’ll mitigate this by making sure our View module adheres to WCAG guidelines. We’ll ensure that all visual elements, metrics, and graphs include proper ARIA labels and descriptive alt text that explicitly communicate the score and meaning to screen readers.
Contextual and Technical Risks
No matter what LLM or CV model we use, they’ll all be trained on real-world data that may contain inherent biases, potentially leading to discriminatory or culturally insensitive feedback. We’ll mitigate this by acknowledging this risk as a fundamental limitation of AI, and hopefully use prompt engineering to instruct the LLM to provide neutral, actionable, and non-discriminatory advice. 

We also have to make sure our API costs don’t balloon due to unchecked or repeated submissions, especially during testing or by dedicated users. We’ll prevent this by implementing strict rate limits per User ID in the Controller (e.g. maximum number of analyses per day or week) and enforce client-side validation before engaging the expensive external APIs.

Finally, we’ll have to make sure we avoid project scope creep. The temptation to add non-essential features (e.g., advanced comparison charts, in-app editing) that exceed the team’s capacity for an introductory project. We’ll focus development exclusively on the defined model-view-controller: secure authentication, profile upload, and basic analysis display. We’ll defer all non-essential features to a hypothetical “Phase 2” backlog to ensure a successful and timely completion of core features.

[Exercise] Write out a list of risks that could affect your project.
Is there a larger social, economic, political, moral, philosophical and or academic context around your project that poses a risk to your users, or the project itself? How will you mitigate this risk? Can you avoid or curb it at all?
Are there people who would oppose your project? (E.g., competitors, people your project puts at risk, etc.)

Contextual and Moral Risks
Social and Philosophical Contextual Risks
We don’t want to reinforce societal biases due to the fact that AI models are trained on existing, successful profiles. The feedback may push all users toward a single, homogenized “ideal” profile style which suppresses individuality. While this risk can’t be avoided, we can curb it through ethical prompt engineering. The LLM prompt must explicitly instruct the model to prioritize authenticity and individuality over conformity.

A moral/philosophical risk is that users may attribute too much weight to the AI-generated "scores" (e.g., humor, confidence) and use them to define their personal self-worth. This over-reliance on a quantitative, external metric for sensitive subjective traits can lead to anxiety, or lower self-esteem. We need to ensure the results dashboard consistently refers to the metrics as "Analysis Scores" or "Style Feedback," explicitly avoiding language that implies objective validation or personal worth. Maintain a neutral, non-judgmental tone throughout the advice.

The current state of academic research and technology in LLM and CV is limited in accurately quantifying complex human qualities like irony, subtle humor, or charisma. The risk is that the technical "analysis" provided is poor, misleading, or factually invalid regarding actual dating success. We need to limit the quantifiable metrics (scores) only to objective features (e.g., lighting, grammar) and frame all subjective LLM advice as suggestions rather than definitive truths, and clearly communicate that the app is a tool for improvement, not a predictor of guaranteed success.
Opposition and Stakeholder Risk
The first opposing group will be dating coaches and consultants. This app provides cheap, instant, scalable feedback. This directly threatens the business model of human dating coaches and consultants who charge high rates for similar (though more nuanced) analysis. We’ll emphasize that the AI is a starting point and does not replace the deep emotional and personal guidance of a human coach, thus framing the app as a complimentary tool.

The second opposing group will be dating app companies. Dating apps thrive on user engagement and time spent optimizing their profile. If your tool makes users too efficient at improving their profiles, they may find a match and leave the app sooner, reducing the app company's potential ad revenue and lifetime user value. This is an unavoidable competitive risk. The mitigation is to ensure your app focuses on user success as its primary metric, differentiating itself from the platform's goal of maximizing engagement time.

The third opposing group will be mental health professionals, who may oppose the product due to concerns about the potential negative psychological impact of quantified, AI-driven critique on sensitive topics like self-image and romantic pursuit. Ideally, we should partner with a mental health resource to include a prominent link to a mental health helpline directly on the results dashboard, to show a commitment to user well-being.

3.4 Testing Plan
In this section, you’ll outline how you plan to test each module of your project! You don’t need to write out each test case at this stage, but you should have a general idea of what edge and generic cases need to be covered by your test suite. (Consider unit testing, integration testing, mocks where appropriate, etc.)

[Exercise] For each module you listed earlier, describe how you would test its functionality and accessibility. Link each set of tests to a user story if possible.

For testing, our goal is to make sure each module works on its own and also plays nicely with the others, without getting lost in an overly complicated test harness. For the View module, we’ll do a mix of basic automated tests (e.g., checking that forms validate correctly and buttons trigger the right calls) and manual, “click-through” testing to make sure the upload flow and results dashboard feel smooth, readable, and accessible. This directly supports user stories about uploading a profile bundle and viewing the feedback report. For the Controller module, we’ll write unit tests that mock the text and image analysis modules and the database, so we can confirm that routes handle valid inputs, reject bad ones, and return the correct error messages without needing the whole system running. For the Text Analysis and Image Analysis modules, we’ll focus on small, targeted tests that check we’re formatting requests correctly, handling API responses and timeouts, and producing structured metrics in the expected format; here we’ll rely heavily on mocks so we don’t spam external APIs. The Data Persistence module will be tested with integration-style tests that verify we can create, read, update, and delete user data securely under the right user ID, and that deleting a profile really removes its associated results. On top of this, we plan to do a small amount of informal user testing with friends who have dating profiles: asking them to upload a profile, interpret the feedback, and tell us where things are confusing. That combination of automated checks, mocked integration tests, and real-user walkthroughs should give us reasonable confidence that the core user stories (from upload, to analysis, to viewing and deleting results) are working as intended.

That’s it!
Congratulations, you’re done! After writing your specification, you’ll need to submit it and get feedback from the staff and your mentor—you’ll always want to take this into account after every mentor meeting. You should also show your specification to stakeholders you spoke with during user research.

Have friends
Lighting 
At least one smiling