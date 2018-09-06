# Ringtail App: Graphed Results
This is an example app built using Ringtail's extensibility APIs to display user coding in graphs.

It demonstrates:
- App setup and construction
- UI Extension SDK initialization
- Connect API querying
- Constructing custom tools in Ringtail's UI
- Responding to user actions from Ringtail, and
- Manipulating Ringtail's Browse selection state

## How to run it
1. Sync this repo locally
1. Run `yarn` on the command line to install dependencies
1. Run `yarn dev` to build the code and start a file change watcher
1. Run `yarn start` to start the webserver
1. Navigate to `http://localhost:12345/` in a browser to verify the app loads

_NOTE: You can change the port via the `GRAPHED_RESULTS_PORT` environment variable._

For a release build, you can also run `yarn release` for a much smaller application bundle.

## How to integrate it with Ringtail
1. Log into Ringtail
1. Ensure the Ringtail Connect API URL is set in portal settings and that the API service is running by checking `http://yourRingtailURL/Ringtail-Svc-Portal/health/test`
1. Navigate to `Portal Home -> UI Extensions`
1. Add a new extension
   - Name: `Graphed Results`
   - Location: Choose one of:
     - `Workspace pane` Graphs data for the current search results
     - `Case landing page` Graphs case-wide data
   - URL: `http://localhost:12345/`
1. Click on the new extension in the list
1. Grant access to it on the `Organizations` and `Cases` tabs so it will show up in a case
1. Enter a case with access to it
1. Navigate to the `Security -> Features` page and grant access to the UI extension for your security group, then refresh your browser to ensure the change took effect
1. If you added it as a `Workspace pane`:
   1. Navigate to the `Documents` area
   1. Edit a workspace and add in the `Graphed Results` pane to see it load up
   1. Run a search to see the graphs populate
1. If you added it as a `Case landing page`:
   1. Navigate to case home
   1. Select the extension tab on the left
