var UndoRedoManager = (function () {

    var singleton = {},
        $root,
        $location,
        unwatch,
        pathRegExp = /state\/([\w-]+)/,
        uuid,
        mainApp,
        firebaseView,
        states = {},
        preventNextSave = false;

    singleton.setFirebaseView = function (fv) {
        if (!firebaseView) {
            firebaseView = fv;
        }
        init();
    };

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

    singleton.setMainApp = function (mA) {
        if (!mainApp) {
            mainApp = mA;
        }
        init();
    };

    function setWatcher () {
        if ($root && $location && !unwatch) {
            unwatch = $root.$watch(function () { return $location.path();}, function (newValue) {
                var newPath = parsePath(newValue);
                if (newPath !== uuid) {
                    uuid = newPath;
                    loadState();
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
            var path = $location.path().replace(/(?:\/?state(?:\/[\w-]*)?)?\/?$/, '/state/'+uuid);
            $location.path(path);
            preventNextSave = true;
        }
    }

    function init () {
        //init () can only be run once
        if (init.done) {
            return;
        }
        setWatcher();
        if ($location && firebaseView && $root) {
            setNewPath();
            init.done = true;
        }
    }

    function loadState () {
        var state = states[uuid];
        firebaseView.loadState(state.snapshot, state.namespace);
        firebaseView.commit();
    }

    function saveState (snapshot, namespace) {
        if (preventNextSave) {
            preventNextSave = false;
            return;
        }
        setNewPath();
        var state = {
            snapshot : snapshot,
            namespace : namespace
        };
        states[uuid] = state;
    }

    singleton.saveState = saveState;


    return function () {return singleton;};

})();

angular.module('atlasDemo').service('undoRedoManager',[ '$rootScope', '$location', 'mainApp', function ($root, $location, mainApp) {
    'use strict';
    var uRM = UndoRedoManager();
    uRM.setLocation($location);
    uRM.setRootScope($root);
    uRM.setMainApp(mainApp);
    return uRM;
}]);
