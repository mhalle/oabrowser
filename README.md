# threejs-atlas-viewer
This repository hosts the files for an atlas viewer application.

This is not a standalone application. You need to provide an atlas structure JSON file in the config.js file.

To use the viewer :
* go in atlas repository
* add this repository as submodule with `git submodule add https://github.com/stity/threejs-atlas-viewer <path-to-submodule-directory>`
* run `bower install` in the new directory
* copy `config.js` in the parent directory of the submodule (it allows git to commit the changes you make to this config file)
* fill `config.js`with your own parameters
* run a server at the root of your initial repository (you can do this with `npm install -g http-server` followed with `http-server`)
* now you can open your browser and enjoy the viewer (if you used `http-server` command, the URL will be http://localhost:8080/path-to-submodule)