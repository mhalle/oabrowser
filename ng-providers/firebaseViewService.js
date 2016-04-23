var FirebaseView = (function () {
    var singleton = {},
        $root,
        $location,
        $firebaseObject,
        $firebaseAuth,
        unlink,
        unwatch,
        pathRegExp = /view\/([\w-]+)/,
        uuid,
        obj;

    singleton.setRootScope = function (root) {
        if (!$root) {
            $root = root;
        }
        init();
    };

    singleton.setLocation = function (location) {
        if (!$location) {
            $location = location;
        }
        init();
    };

    singleton.setFirebase = function (firebaseObject, firebaseAuth) {
        if (!$firebaseAuth && !$firebaseObject) {
            $firebaseObject = firebaseObject;
            $firebaseAuth = firebaseAuth;
        }
        init();

    };

    function setWatcher () {
        if ($root && $location && !unwatch) {
            unwatch = $root.$watch(function () { return $location.path();}, function (newValue) {
                uuid = parsePath(newValue);
                loadDatabaseConnection();
            });
        }
    }

    function parsePath (path) {
        var match = path.match(pathRegExp);
        if (match) {
            return match[1];
        }
        return '';
    }

    function generateUUID() {
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (d + Math.random()*16)%16 | 0;
            d = Math.floor(d/16);
            return (c==='x' ? r : (r&0x3|0x8)).toString(16);
        });
        return uuid;
    }

    function setNewPath () {
        if ($location) {
            uuid = generateUUID();
            $location.path('view/'+uuid);
            loadDatabaseConnection();
        }
    }

    function init () {
        setWatcher();
        if ($location && $firebaseObject) {
            var initialPath = parsePath($location.path());
            if (initialPath.length === 0) {
                setNewPath();
            }
        }
    }

    function loadDatabaseConnection () {
        var ref = new Firebase("https://atlas-viewer.firebaseio.com/views/"+uuid);

        if (obj) {
            obj.$destroy();
        }
        obj = $firebaseObject(ref);
        // this waits for the data to load and then logs the output. Therefore,
        // data from the server will now appear in the logged output. Use this with care!
        obj.$loaded()
            .then(function() {
            console.log(obj);
        })
            .catch(function(err) {
            console.error(err);
        });
        obj.$bindTo(singleton, 'view');

        singleton.view = singleton.view || {};
        singleton.obj = obj;
        singleton.ref = ref;

        //var auth = $firebaseAuth(ref);
    }


    return function () {return singleton;};

})();

angular.module('atlasDemo').service('firebaseView',[ '$rootScope', '$location', '$firebaseObject', '$firebaseAuth', function ($root, $location, $firebaseObject, $firebaseAuth) {
    'use strict';
    var fv = FirebaseView();
    fv.setLocation($location);
    fv.setRootScope($root);
    fv.setFirebase($firebaseObject, $firebaseAuth);
    return fv;
}]);
