## adaptStrap lightweight UI Components/utilities based on AngularJs 1.2+ & Bootstrap 3 - [demo](http://adaptv.github.io/adapt-strap/) 
[![Build Status](https://travis-ci.org/Adaptv/adapt-strap.svg)](https://travis-ci.org/Adaptv/adapt-strap) [![Test Coverage](https://codeclimate.com/github/Adaptv/adapt-strap/badges/coverage.svg)] (https://codeclimate.com/github/Adaptv/adapt-strap) [![Code Climate](https://codeclimate.com/github/Adaptv/adapt-strap/badges/gpa.svg)](https://codeclimate.com/github/Adaptv/adapt-strap)
---
[![Banner](http://adaptv.github.io/adapt-strap/docs/images/adapt-strap.png)](http://adaptv.github.io/adapt-strap/)

### Available components/features:
- **Table Lite** - simple table UI that renders your local data models and does local pagination/sorting
- **Table AJAX** - advanced table UI that renders remote data models and does remote pagination/sorting
- **Tree Browser** - simple tree UI that allows you to brows through local data models in a tree structure
- **Infinite Dropdown** - simple directives to implement infinite scroll dropdowns/multi selectors
- **Loading Indicators** - simple directives to render overlay and inline loading indicators
- **Drag and Drop** - simple directives to enable drag and drop capabilities
- **Global configuration** - all the components are globally configurable to use your set of icons and pagination/sorting configuration
- **Customizable** - all the components are highly customizable.

###dependencies:
```
jquery
angularjs
angular-sanitize
bootstrap
```

###Usage
* Install the library using `bower install adapt-strap --save`
* Include the library files in your index.html file:
```html
<!-- dependencies -->
<script src="bower_components/jquery/dist/jquery.js"></script>
<script src="bower_components/angular/angular.js"></script>
<script src="bower_components/angular-sanitize/angular-sanitize.js"></script>
<script src="bower_components/bootstrap/js/bootstrap.js"></script>
<link rel="stylesheet" href="bower_components/bootstrap/css/bootstrap.css"/>

<!-- adapt-strap -->
<script src="bower_components/adapt-strap/dist/adapt-strap.min.js"></script>
<script src="bower_components/adapt-strap/dist/adapt-strap.tpl.min.js"></script>
<link rel="stylesheet" href="bower_components/adapt-strap/dist/adapt-strap.min.css"/>
```
* Add adaptv.adaptStrap module as a dependency to you main app module:
```javascript
angular.module('myApp', [
    'ngSanitize', // adapt-strap requires ngSanitize
    'adaptv.adaptStrap'
]);
```
* Read the [documentation](http://adaptv.github.io/adapt-strap/) to see the demo and usage of components

###Developers one time setup:
* Fork the repo under your github account and clone it locally
* Configure upstream:
```
git remote add upstream https://github.com/Adaptv/adapt-strap.git
```

###Developers Contribute:
* Sync with upstream:
```
git fetch upstream
git checkout master
git merge upstream/master
```

* install local packages
```
sudo npm install
bower install
```

* run local environment. It will watch for changes and re-build
```
gulp
```
* your local dev is running at `http://localhost:9003`
* you can force local build by `gulp dist`

* Make your changes under master. Also write/modify tests under src/xyz/test directory.

* run validators and tests before commit and fix html, and js errors.
```
gulp dist
gulp validate
gulp unit
gulp e2e_sauce
```

* push your changes 
* go to your github account and under forked repo, submit the pull request

###Author
---
####Kash Patel

- [https://github.com/kashjs](https://github.com/kashjs)
- [https://twitter.com/kashjs](https://twitter.com/kashjs)

---

###The MIT License

Copyright (c) 2010-2014 adap.tv, Inc. http://adap.tv

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
