Quality guidelines
Guideline

This page describes a number of guidelines to publish a succesful game on the CrazyGames platform. The guidelines should be used alongside our mandatory requirements.

Whether a game is "good" or "bad" can often be subjective, but there are best practices learned from our experiences with successful games. The following list is non-exhaustive.

Onboarding
For a game to be successful it is crucial that users get to gameplay quickly, understand what the game is about and how to control it. A good onboarding is paramount to make this possible:

Provide a simple onboarding phase where new users land directly.
Implement the onboarding in gameplay.
Focus on the core functionality so users can start playing, avoid explaining every single feature.
Make the onboarding phase skippable.
Prioritize visuals and limit the use of text for onboarding.
Show the user how to control the game with a keyboard overlay or mouse gestures. See Restricted Keys for more info.
Make sure the UI is clear.
Buttons are clearly labeled to indicate how to proceed.
Buttons are not sized to encourage ads or other behaviors.
Buttons do not have delays to confuse users or encourage other behaviors.
General principles
Once a user is onboarded into the game, here are some general principles for web games:

There are clear goals that the player can reach.
The game is easy to learn.
The game is easy to understand — the language is correct and clear, well translated, or the game makes good use of universal graphics prompts.
The controls are consistent and intuitive throughout the game.
What makes your game a fun experience?
Attributes of a web game that adheres to best practices:

The game responds quickly to the player's actions.
The challenge, strategy, and game story are balanced and well-paced.
The display layout is comfortable and intuitive.
The audio is comfortable and appropriate for the game.
The game interface is designed for the user's device (desktop and optionally mobile).
Various player segments can enjoy the game.
The game story or scenarios are interesting where applicable.
There are no overly repetitive or "boring" tasks in the game.
The game processes information quickly to give players a feeling of smooth flow and continuity.
Solo play and playing with friends:
Playing alone is as prominent as playing with friends if both are offered.
If playing alone is not available, the game clearly explains that.
Is your game unique?
Attributes of a web game that adheres to best practices:

It should be easy to improve or modify the game to add new content like new levels, art, story elements, etc.
Major features such as the game's genre should not change after submission.
The game should be frequently maintained and updated.
The game is not easily confused with another that features a similar name or iconography.
The game does not use a common identifier unless the game developer owns the respective IP.
E.g. the name “Super Chess” is unique and clear, while simply “Chess” is not.
The name “Scrabble” is clear and unique, but can only be used by the IP holder.
Is your game aesthetically pleasing?
Attributes of a web game that adheres to best practices:

Graphics should be of high quality.
High resolution — quality games are visually pleasing.
Quality games have consistent resolution throughout the game.
Quality games are free of graphical defects like compression artifacts.
Audio should be of high quality
Audio levels are consistent.
Sounds aren't too loud or quiet
Any music in the game complements the visual experience
In addition to having no technical graphical issues, the game is internally consistent, coherent, and has attractive visuals. The games aesthetic style should remain consistent and not switch between looks i.e. moving from realistic to cartoony, or high resolution to low resolution.

The game is clear about what it is. It isn't misleading and is clear about what genre and type of game it is overall. The name and imagery presented on CrazyGames should reflect accurately the type of game the player will experience. The game only changes its name and associated imagery where totally necessary, such as when a significant update or visual overhaul of the game takes place.

Restricted Keys
It's important that the game controls are intuitive and easy to learn.
Preferably make your key bindings adapt to the user's keyboard layout, rather than requiring the user to change their own bindings.
Note that in some countries, like France, the standard keyboard has AZERTY layout, and the typical WASD keys for movement are ZQSD on that layout.
Avoid common keys that have other behaviour on web:
Escape closes fullscreen
Ctrl / Cmd + W closes the tab; you can disable this when the user is in fullscreen


Requirements
To be published on CrazyGames, your game must meet our requirements. We designed these standards to ensure all games on our platform are fun, unique, visually appealing, and properly integrated.

Our launch process consists of 2 steps. Read more about the principles on the introduction page.

A game in Basic Launch allows you to go live without needing to customize your game for CrazyGames. The CrazyGames SDK is optional and monetization is not available. Review the Basic Launch Guide to understand how progression is evaluated.
Once your game has been selected for Full Launch, you are required to comply to all integration requirements listed below, including the CrazyGames SDK.
The table below provides a summary of the key requirements. Each category has a dedicated page with detailed descriptions:

Category	Basic Implementation
Basic Implementation	Full Implementation*
Full Implementation
Technical	
Initial download size ≤ 50MB
Total file size ≤ 250MB (50MB without SDK)
File count ≤ 1500
SDK & GameplayStart event
Gameplay	
Basic visual QA checks
Adhere to PEGI12
Full visual QA check
Land directly in gameplay
Advertisement	
CrazyGames monetization is disabled
No external ads
Ads through SDK, following our guidelines
Works with AdBlock
Account integration
Only when applicable	
No external login options
Progress is linked to CrazyGames Account
Use CrazyGames username & avatar
Automatic login for CrazyGames users
Multiplayer
Only when applicable	Full implementation features might increase engagement and are optional in basic launch	
User room info
Invite link (if applicable)
Instant multiplayer flow
Keep rooms across rounds
DisableChat preference
In-game Purchases
Invite Only	Not available	
Use CrazyGames Xsolla account and userId
* A full implementation should implement the basic implementation requirements as well.

Our HTML5 and Unity SDKs support all the scenarios. Other SDKs might miss certain functionalities.

As part of the submission process, you will also need to provide qualitative metadata (game description and controls) and Game covers (images and videos).

Guidelines & resources
Additionally we offer some Quality Guidelines to optimize your game for success on the CrazyGames platform. These are optional but based on our insights in our audience and web gaming. Guidelines are marked with Guideline throughout the documentation.

Lastly have a look at the Resources provided on this site for additional tips to publish a succesful web game.

Monetization
The primary monetization mechanism we offer is through advertisement revenue share. Only ads served through our SDK are allowed, refer to our Advertisement requirements.

Selected games are eligible for In-game Purchases. A Full Implementation is required, using Xsolla as payments provider. Contact our team if you want to apply for this.

Insights & Analytics
Once your game has been published, you'll be able to monitor key game metrics on your Developer Dashboard. These are some of the metrics we provide by default:

Players
Average playtime
Gameplay conversion
Retention
Revenue
To further optimize your game and access advanced analytics — including level progression, drop-off points, and user journey tracking — we recommend utilizing ByteBrew. This powerful, free analytics tool is simple to integrate, enabling you to enhance player engagement and boost the visibility of your game on the Crazy Games Portal.

Warning

In case your game collects additional personal data beyond the events in our SDK, the game should add a Terms & Conditions and/or Privacy Policy notice to new players. Check the User Consent section for details.

Technical support for SDK integration
Once your games reach 50k plays (combined), we can offer you technical support with SDK integration. This threshold allows us to give each developer individual feedback on ad placements and integration.

Quality Assurance Tool
On our Developer Portal you'll be able to preview your game. It allows you to:

Run your game as it would on CrazyGames
Check if your game meets our requirements
Test all the SDK features that you implemented and get feedback about it