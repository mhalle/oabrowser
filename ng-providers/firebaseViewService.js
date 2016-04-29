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
        mainApp,
        $body,
        unbindFunctions = [],
        bindObjects = [];

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

    function authAnonymously (ref) {
        if (!singleton.auth) {
            ref.authAnonymously(function(error, authData) {
                if (error) {
                    console.log("Authentication Failed!", error);
                } else {
                    console.log("Authenticated successfully with payload:", authData);
                    singleton.auth = authData;
                }
            });
        }
    }

    function loadDatabaseConnection () {
        var ref = new Firebase("https://atlas-viewer.firebaseio.com/views/"+uuid);
        if (obj) {
            obj.$destroy();
            unbindAll();
        }
        obj = $firebaseObject(ref);
        // this waits for the data to load and then logs the output.
        obj.$loaded()
            .then(function() {
            console.log(obj);
        })
            .catch(function(err) {
            console.error(err);
        });
        obj.$bindTo($root, 'view');
        $root.view = $root.view || {};
        singleton.obj = obj;
        singleton.ref = ref;

        function onValue (snapshot) {
            //skip one frame to be sure that all the copies have been done
            if (singleton.auth.uid !== snapshot.val().lastModifiedBy) {
                requestAnimationFrame(function () {
                    mainApp.emit('firebaseView.viewChanged');
                });
            }
        }
        ref.on('value', onValue);

        singleton.auth = ref.getAuth();
        authAnonymously(ref);

        function authHandler (authData) {
            if (authData) {
                singleton.auth = authData;
            }
            else {
                singleton.auth = null;
                authAnonymously(ref);
            }
        }
        ref.onAuth(authHandler);
        function onMouseUp () {
            ref.child('lastModifiedBy').set(singleton.auth.uid);
        }

        $body = $('body');
        $body.on('mouseup', onMouseUp);

        function unbind () {
            ref.off();
            ref.offAuth(authHandler);
            $body.off('mouseup', onMouseUp);
        }

        unbindFunctions.push(unbind);

        recreateAllBindings();

    }

    singleton.customBind = function (watchCallback, dbChangeCallback, ref) {
        function onValue (snapshot) {
            if (singleton.auth.uid !== snapshot.val().lastModifiedBy) {
                dbChangeCallback(snapshot);
            }
        }
        ref = ref || singleton.ref;

        var obj = $firebaseObject(ref);

        ref.on('value', onValue);
        function temp () {
            watchCallback(obj);
            obj.lastModifiedBy=singleton.auth.uid;
            obj.$save();
        }
        var mouseUpTimeoutId;
        function onMouseUp () {
            clearTimeout(mouseUpTimeoutId);
            mouseUpTimeoutId = setTimeout(temp,30);
        }
        $body.on('mouseup', onMouseUp);

        var wheelTimeoutId;
        function onMouseWheel () {
            clearTimeout(wheelTimeoutId);
            wheelTimeoutId = setTimeout(temp,1000);
        }
        $body.on('mousewheel', onMouseWheel);

        function unbind () {
            ref.off();
            $body.off('mouseup', onMouseUp);
            $body.off('mousewheel', onMouseWheel);
        }

        unbindFunctions.push(unbind);
    };

    function unbindAll () {
        unbindFunctions.map(unbind => unbind());
        unbindFunctions = [];
    }

    function createBinding (obj, key, pathArray) {
        var i,
            ref = singleton.ref,
            temp;
        for (i = 0; i < pathArray.length; i++) {
            ref = ref.child(pathArray[i]);
        }
        if (typeof key === 'string') {
            key = [key];
        }
        function onValue (snapshot) {
            var val = snapshot.val();
            if (typeof val === 'object' && val !== null) {
                for (var i = 0 ; i<key.length;i++) {
                    obj[key[i]] = val[key[i]];
                }
            }
        }

        temp = function (dbObj) {
            var v ;
            for (var i = 0 ; i<key.length;i++) {
                v = obj[key[i]];
                //prevent values to be undefined because firebase does not handle undefined value
                dbObj[key[i]] = v === undefined ? false : v;
            }
        };

        singleton.customBind(temp, onValue, ref);

    }

    singleton.bind = function (obj, key, path) {
        var pathArray = path !== '' ? path.split('.') : [];

        createBinding(obj, key, pathArray);

        var bindObject = {
            obj : obj,
            key : key,
            pathArray : pathArray
        };

        bindObjects.push(bindObject);

    };

    function recreateAllBindings () {
        bindObjects.map(bindObject => createBinding(bindObject.obj, bindObject.key, bindObject.pathArray));
    }



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
