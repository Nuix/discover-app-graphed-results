# Discover App: Graphed Results
This is an example app built using Discover's extensibility APIs to display user coding in graphs.

It demonstrates:
- App setup and construction
- UI Extension SDK initialization
- Connect API querying
- Constructing custom tools in Discover's UI
- Responding to user actions from Discover, and
- Manipulating Discover's Browse selection state

## How to run it
1. Sync this repo locally.
1. Run `yarn` on the command line to install dependencies.
1. Run `yarn dev` to build the code, start a file change watcher, and launch the dev server.
1. Navigate to `http://localhost:12345/` in a browser to verify that the app loads.

_NOTE: You can change the port via the `GRAPHED_RESULTS_PORT` environment variable._

## How to integrate it with Discover
1. Log in to Discover.
1. On the `Portal Management -> Settings -> Portal Options` page, make sure that the **Discover Connect API URL** is set. Test that the API service is running by checking `http://yourDiscoverURL/yourDiscoverPortal/health/test`.
1. Navigate to `Portal Home -> UI Extensions`.
1. Add a new extension with the following values:
   - Name: `Graphed Results`
   - Location: Choose the location in Discover for the extension to appear:
     - `Workspace pane`: Graphs data for the current search results
     - `Case home page`: Graphs data for the current case
   - URL: `http://localhost:12345/`
1. Click on the new extension in the list.
1. On the `Organizations` and `Cases` pages, grant access to the extension so that the extension will be available in a case.
1. Open a case with access to the extension.
1. Navigate to the `Security -> Features` page and grant access to the UI extension for your security group. Then, refresh your browser to make sure that the change takes effect.
1. Depending on the location of the extension:
   - If you added the extension as a `Workspace pane`:
      1. Navigate to the `Documents` page.
      1. Edit a workspace and add the `Graphed Results` pane to see it load up.
      1. Run a search to see the graphs populate.
   - If you added the extension as a `Case home page`:
      1. Navigate to the Case Home page.
      1. Click the extension tab in the navigation pane.

## How to deploy it to production
1. Run `yarn release` to build the minified production app.
1. Copy the assets from the `dist/` folder to your web server.
   - You should see `index.html`, `app.js`, and six `.png` files with hashed file names in this folder.
1. In Discover, on the `Portal Management -> UI Extensions` page, click the extension. Then, update the extension `URL` to reference the new web server location.

# License

Copyright 2021 Nuix

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.