# Automatic Twitch Dota 2 Predictions

[![Sponsor](https://img.shields.io/badge/💜-sponsor-blueviolet)](https://github.com/sponsors/cpz)

## Installation
```
git clone https://github.com/cpz/tpd2.git
npm install
```
## Run
```
npm run start
```
## Preparation

Edit config file (```config/default.json```).
```
{
  // Dota 2 Twitch Predictions bot
  "twitch": {
      "access_token": "accesstoken", // DO NOT SHARE WITH ANYONE
      "client_id": "clientid", // DO NOT SHARE WITH ANYONE
      "login": "twitchdev", // your twitch login
      "prediction_title": "I'll win", // any text for prediction title
      "win_text": "Sure!", // any text for win prediction text
      "lose_text": "Definitely not!", // any text for lose prediction text
      "prediction_window": 300, // time before prediction closes in seconds
    },
}
```

Copy ```config/gamestate_integration_tpd2.cfg``` to ```steamapps\common\dota 2 beta\game\dota\cfg\gamestate_integration\```

## Explanation
Dota 2 does have Game State Integration (GSI) which can provide information to any 3rd app about current game like your health, mana and etc. We are creating our own GSI server and listen for changes in game_state which identify what phase of game at this moment and at end of game reading who win.
