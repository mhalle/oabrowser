var FirebaseView = (function () {
    var singleton = {},
        $root,
        $location,
        $firebaseObject,
        $firebaseAuth,
        unwatch,
        pathRegExp = /view\/([\w-]+)/,
        uuid,
        obj,
        mainApp;

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

    singleton.setMainApp = function (mA) {
        if (!mainApp) {
            mainApp = mA;
        }
    };

    function setWatcher () {
        if ($root && $location && !unwatch) {
            unwatch = $root.$watch(function () { return $location.path();}, function (newValue) {
                var newPath = parsePath(newValue);
                if (newPath !== uuid) {
                    uuid = newPath;
                    loadDatabaseConnection();
                }
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
            else {
                uuid = initialPath;
                loadDatabaseConnection();
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
        obj.$bindTo($root, 'view');
        $root.view = $root.view || {};
        singleton.view = $root.view;
        console.log(singleton.view);
        singleton.obj = obj;
        singleton.ref = ref;

        ref.on('value', function () {
            //skip one frame to be sure that all the copies have been done
            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    mainApp.emit('firebaseView.viewChanged');
                });
            });
        });

        //var auth = $firebaseAuth(ref);
    }

    singleton.customBind = function (watchCallback, dbChangeCallback) {
        singleton.ref.on('value', dbChangeCallback);
        function temp () {
            watchCallback($root.view);
            requestAnimationFrame(temp);
        }
        requestAnimationFrame(temp);
    };

    singleton.bind = function (obj, key, path) {
        var pathArray = path !== '' ? path.split('.') : [],
            i,
            ref = singleton.ref,
            dbObj,
            temp;
        for (i = 0; i < pathArray.length; i++) {
            ref = ref.child(pathArray[i]);
        }
        if (typeof key === 'string') {
            key = [key];
        }
        ref.on('value', function (snapshot) {
            var val = snapshot.val();
            if (typeof val === 'object' && val !== null) {
                for (var i = 0 ; i<key.length;i++) {
                    obj[key[i]] = val[key[i]];
                }
            }
        });

        dbObj = $firebaseObject(ref);
        temp = function () {
            for (var i = 0 ; i<key.length;i++) {
                dbObj[key[i]] = obj[key[i]];
            }
            dbObj.$save();
        };
        $('body').on('mouseup', temp);
        //TODO : provide an unbind mechanism
    };


    return function () {return singleton;};

})();

angular.module('atlasDemo').service('firebaseView',[ '$rootScope', '$location', '$firebaseObject', '$firebaseAuth', 'volumesManager', 'mainApp', function ($root, $location, $firebaseObject, $firebaseAuth, volumesManager, mainApp) {
    'use strict';
    var fv = FirebaseView();
    fv.setLocation($location);
    fv.setRootScope($root);
    fv.setFirebase($firebaseObject, $firebaseAuth);
    fv.setMainApp(mainApp);
    volumesManager.setFirebaseView(fv);
    return fv;
}]);
