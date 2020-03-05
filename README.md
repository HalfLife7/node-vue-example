#
# Technologies used:

- Node (backend)
- Vue (frontend)
- Vuex (state management)
- Vue Router (routing)
- Slack
- Socket.io
- Redis pub/sub

#
# Get started

- Start server.js then generator.js to start project.
- Main page can be reached at http://localhost:3000/
- Once started, the generator will randomly send messages to one of 3 channels (boiling, mashing or fermentation) with 1 of 3 statuses (valid, warning or error) using redis pub/sub channels.

# Twilio instructions

- Twilio number - +1-289-204-7708
- Texting the twilio number with the syntax &quot;update status text&quot; will show up in the updates
- Ex: update error sleepy
