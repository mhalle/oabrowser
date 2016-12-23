# OABrowser
This repository hosts the source code for the Open Anatomy Browser (OABrowser), a web-based viewer for anatomy atlases.

## Building
```
npm install
./node_modules/.bin/webpack
```

## Deployment
This code is designed to run in a subdirectory of an atlas data directory, such as `viewer/`.  For example, check out the atlas repository [spl-brain-atlas](https://github.com/mhalle/spl-brain-atlas) and place the `viewer` subdirectory of the `slicer` directory.

Use a local web server to serve the atlas repository, and direct your browser to the `viewer` directory.  The `index.html` in that directory should load OABrowser.

###Demos
[dev.openanatomy.org/atlases](https://dev.openanatomy.org/atlases)

###Working with service workers :
(Currently, Service Workers as disabled to simplify development.) 

A Service Worker is registred to enhance user experience by providing offline support but as it uses cache for everything, you will need to follow these steps (with Google Chrome) in case you change your local files.
* open developer tools
* check that the checkbox "disable cache" in the network panel is checked
* long push on the refresh button
* "Empty Cache and Hard Reload"
