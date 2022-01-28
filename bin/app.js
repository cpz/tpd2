import superagent from "superagent";
const { patch, get, post } = superagent;

import dota_gsi from "dota2-gsi";
import config from "config";

var server;
var clients = [];

let twitch_user = {
  id: "1",
  login: "twitchdev",
  display_name: "twitchdev",
  access_token: "none",
  client_id: "none",
  current_team: "",
  current_prediction_id: "",
  prediction_title: "I'll win?",
  win_text: "Sure!",
  win_id: "",
  lose_text: "Definitely not!",
  lose_id: "",
  prediction_window: 300,
};

function send_result(outcome_id) {
  patch("https://api.twitch.tv/helix/predictions")
    .send({
      broadcaster_id: twitch_user.id,
      id: twitch_user.current_prediction_id,
      status: "RESOLVED",
      winning_outcome_id: outcome_id,
    })
    .set("Client-Id", twitch_user.client_id)
    .auth(twitch_user.access_token, { type: "bearer" })
    .set("Accept", "application/json")
    .then((res) => {
      console.log(JSON.parse(res.text)["data"][0]["status"]);
    })
    .catch((err) => {
      console.log(err.message);
    });
}

// Call start
(async () => {
  const twitch_config = config.get("twitch");

  twitch_user.access_token = twitch_config.access_token;
  twitch_user.client_id = twitch_config.client_id;
  twitch_user.login = twitch_config.login;
  twitch_user.prediction_title = twitch_config.prediction_title;
  twitch_user.win_text = twitch_config.win_text;
  twitch_user.lose_text = twitch_config.lose_text;
  twitch_user.prediction_window = twitch_config.prediction_window;

  var user_data;
  await get("https://api.twitch.tv/helix/users")
    .query({ login: twitch_user.login })
    .set("Client-Id", twitch_user.client_id)
    .auth(twitch_user.access_token, { type: "bearer" })
    .set("Accept", "application/json")
    .then((res) => {
      user_data = JSON.parse(res.text)["data"][0];
    })
    .catch((err) => {
      console.log(err.message);
    });

  if (!user_data) return;

  twitch_user.id = user_data.id;
  twitch_user.display_name = user_data.display_name;

  console.log(
    `Dota 2 Twitch Predictions started as ${twitch_user.display_name}`
  );

  server = new dota_gsi({
    port: 1337,
  });

  server.events.on("newclient", function (client) {
    clients.push(client);

    client.on("map:game_state", function (game_state) {
      if (game_state == "DOTA_GAMERULES_STATE_PRE_GAME") {
        twitch_user.current_team = client.gamestate.player.team_name;
        console.log(`Streamer team: ${twitch_user.current_team}`);
        console.log("send prediction");

        const res = post("https://api.twitch.tv/helix/predictions")
          .send({
            broadcaster_id: twitch_user.id,
            title: twitch_user.prediction_title,
            outcomes: [
              {
                title: twitch_user.win_text,
              },
              {
                title: twitch_user.lose_text,
              },
            ],
            prediction_window: 300,
          })
          .set("Client-Id", twitch_user.client_id)
          .auth(twitch_user.access_token, { type: "bearer" })
          .set("Accept", "application/json")
          .then((res) => {
            var prediction_data = JSON.parse(res.text)["data"][0];
            twitch_user.current_prediction_id = prediction_data.id;
            prediction_data.outcomes.forEach((element) => {
              if (element.title == twitch_user.win_text)
                twitch_user.win_id = element.id;

              if (element.title == twitch_user.lose_text)
                twitch_user.lose_id = element.id;
            });
          })
          .catch((err) => {
            if (twitch_user.current_prediction_id !== null)
              twitch_user.current_prediction_id = null;

            console.log(err.message);
            console.log(err);
          });
      }

      if (game_state == "DOTA_GAMERULES_STATE_POST_GAME") {
        var winner = client.gamestate.map.win_team;
        console.log(`Winner team: ${winner}`);
        if (winner == twitch_user.current_team) {
          console.log("streamer won!");
          send_result(twitch_user.win_id);
        } else {
          console.log("streamer lose!");
          send_result(twitch_user.lose_id);
        }
      }
    });
  });
})();
