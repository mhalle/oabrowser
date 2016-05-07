var FirebaseView = (function () {
    var singleton = {},
        $root,
        $location,
        $firebaseObject,
        $firebaseAuth,
        unwatch,
        pathRegExp = /view\/([\w-]+)/,
        uuid,
        dbRootObj,
        mainApp,
        $body,
        unbindFunctions = [],
        bindObjects = [],
        loadingNewView = true,
        loadingManager,
        initiated = false,
        createdView = false,
        namespaces = {},
        undoRedoManager,
        stateNeedsToBeSaved;

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

    singleton.setLoadingManager = function (lm) {
        if (!loadingManager) {
            loadingManager = lm;
        }
    };

    singleton.setUndoRedoManager = function (uRM) {
        if (!undoRedoManager) {
            undoRedoManager = uRM;
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
            var path = $location.path().replace(/view\/[\w-]+/, 'view/'+uuid);
            $location.path(path);
            createdView = true;
            loadDatabaseConnection();
        }
    }

    function init () {
        //init () can only be run once
        if (initiated) {
            return;
        }
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
            initiated = true;
        }
    }

    function initRootListenersAndCommiters () {
        //only called once
        if (initRootListenersAndCommiters.done) {
            return;
        }

        createNamespace('root');
        createNamespace('authors');

        //propagate event on value
        function onValueFireEvent () {
            requestAnimationFrame(function () {
                mainApp.emit('firebaseView.viewChanged');
            });
        }
        namespaces.root.listeners.push(onValueFireEvent);

        //always try to add himself as author
        function addHimselfAsAuthor () {
            dbRootObj.lastModifiedBy = singleton.auth.uid;

            //add himself to the list of authors
            if (!dbRootObj.authors || !dbRootObj.authors[singleton.auth.uid]) {
                dbRootObj.authors = dbRootObj.authors || {};
                dbRootObj.authors[singleton.auth.uid] = true;
            }
        }
        namespaces.authors.commiters.push(addHimselfAsAuthor);

        initRootListenersAndCommiters.done = true;
    }

    function authAnonymously (ref) {
        if (!singleton.auth) {
            ref.authAnonymously(function(error, authData) {
                if (error) {
                    console.log("Authentication Failed!", error);
                } else {
                    console.log("Authenticated successfully with payload:", authData);
                    singleton.auth = authData;
                    loadViewerConnection();
                }
            });
        }
        else {
            loadViewerConnection();
        }
    }

    function authHandler (authData) {
        if (authData) {
            singleton.auth = authData;
        }
        else {
            //get to this part when user log out
            singleton.auth = null;
            authAnonymously(singleton.ref);
        }
    }

    function loadViewerConnection () {
        var ref = new Firebase("https://atlas-viewer.firebaseio.com/views/"+uuid+"/viewers/"+singleton.auth.uid);

        var int = setInterval(function () {
            ref.child('lastUpdate').set(Date.now());
        }, 30000);

        ref.on('value', function(snapshot) {
            //reload the connection if one of the author give him the edition rights
            var val = snapshot.val();
            if (val && val.author) {
                loadDatabaseConnection();
            }
        });

        function unbind () {
            clearInterval(int);
        }
        $(window).unload(function () {
            ref.remove();
        });
        unbindFunctions.push(unbind);
    }

    function loadDatabaseConnection () {

        var ref = new Firebase("https://atlas-viewer.firebaseio.com/views/"+uuid);

        //if dbRootObj is defined then we are changing view and need to destroy previous references
        if (dbRootObj) {
            dbRootObj.$destroy();
            unbindAll();
        }

        loadingNewView = true;
        dbRootObj = $firebaseObject(ref);
        // this waits for the data to load and then logs the output.
        dbRootObj.$loaded()
            .then(function() {
            console.log(dbRootObj);
        })
            .catch(function(err) {
            console.error(err);
        });
        singleton.obj = dbRootObj;
        singleton.ref = ref;


        ref.on('value', function (snapshot) {onValue(snapshot, 'root');});
        ref.on('child_changed', function (snapshot) {onValue(snapshot, snapshot.key());});

        singleton.auth = ref.getAuth();
        authAnonymously(ref);


        ref.onAuth(authHandler);

        //handle event propagation listener and author commiter
        initRootListenersAndCommiters();


        var onMouseUp = (function () {
            commit();
        }).debounce(30);
        var onMouseWheel = (function () {
            commit();
        }).debounce(1000);
        $body = $(document.body);
        $body.on('mouseup', onMouseUp);
        $body.on('mousewheel', onMouseWheel);

        function unbind () {
            ref.off();
            ref.offAuth(authHandler);
            $body.off('mouseup', onMouseUp);
            $body.off('mousewheel', onMouseWheel);
        }

        unbindFunctions.push(unbind);

    }

    function commit (namespace) {
        if (!dbRootObj.locked) {
            if (!loadingManager.isLoading() || createdView){
                //if there is a namespace, commit only the namespace
                if (namespace && namespaces[namespace] && namespaces[namespace].commiters) {
                    namespaces[namespace].commiters.map(fn => fn());
                    singleton.ref.child(namespace).set(dbRootObj[namespace]);
                }
                //if no namespace is defined then commit is for all namespaces
                else {
                    for (var name in namespaces) {
                        if (namespaces[name].commiters) {
                            namespaces[name].commiters.map(fn => fn());
                        }
                    }
                    dbRootObj.$save();
                    createdView = false;
                }
                //state must be save
                stateNeedsToBeSaved = true;
            }
        }
    }

    function onValue (snapshot, namespace) {
        var snapshotValue = snapshot.val(),
            name;
        if (snapshotValue && !createdView && namespaces[namespace] && namespaces[namespace].listeners) {
            if (loadingManager.isLoading() && namespace === 'root') {
                //wait for the application to be loaded and then call every listeners to copy db values
                mainApp.on('loadingManager.loadingEnd', function () {
                    setTimeout(function () {
                        for (name in namespaces) {
                            if (namespaces[name].listeners) {
                                var val = name === 'root' ? snapshotValue : snapshotValue[name];
                                namespaces[name].listeners.map(fn => fn(val));
                            }
                        }
                        loadingNewView = false;
                    },500);
                });
            }
            else if (singleton.auth.uid !== snapshotValue.lastModifiedBy || loadingNewView) {
                // if we are loading a new view, child changed is not called and therefore we need to call every listeners on value
                if (namespace === 'root' && loadingNewView) {
                    undoRedoManager.saveState(snapshot);
                    for (name in namespaces) {
                        if (namespaces[name].listeners) {
                            var val = name === 'root' ? snapshotValue : snapshotValue[name];
                            namespaces[name].listeners.map(fn => fn(val));
                        }
                    }
                    loadingNewView = false;
                }
                // child changed event received therefore we only call the corresponding listeners
                else {
                    if (namespaces[namespace] && namespaces[namespace].listeners) {
                        namespaces[namespace].listeners.map(fn => fn(snapshotValue));
                    }
                }
            }
            else if (singleton.auth.uid === snapshotValue.lastModifiedBy && namespace === 'root' && stateNeedsToBeSaved) {
                undoRedoManager.saveState(snapshot);
                stateNeedsToBeSaved = false;
            }
        }
    }

    function getDbObj (pathArray, snapshotValue, namespace) {
        //retrieve the right db object from the path array
        // the reference can't be stored in memory because dbRootObj replaces its children by copies from the db
        var obj = snapshotValue || dbRootObj;
        if (namespace) {
            if (!obj[namespace]) {
                obj[namespace] = {};
            }
            obj = obj[namespace];
        }
        for (var i = 0; i < pathArray.length; i++) {
            if (!obj[pathArray[i]]) {
                obj[pathArray[i]] = {};
            }
            obj = obj[pathArray[i]];
        }
        return obj;
    }

    function createNamespace (namespace) {
        if (!namespaces[namespace]) {
            namespaces[namespace] = {
                listeners : [],
                commiters : []
            };
        }
    }

    singleton.customBind = function (watchCallback, dbChangeCallback, pathArray) {

        var namespace = pathArray.shift() || 'root';
        createNamespace(namespace);

        function onValueListener (snapshotValue) {
            if (snapshotValue) {
                var dbObj = getDbObj(pathArray, snapshotValue);
                if (dbObj) {
                    dbChangeCallback(dbObj);
                }
            }
        }

        namespaces[namespace].listeners.push(onValueListener);


        function commiter () {
            var dbObj = getDbObj(pathArray, null, namespace);
            var modified = watchCallback(dbObj);
            modified = modified === undefined ? true : modified;
            return modified;
        }

        namespaces[namespace].commiters.push(commiter);

    };

    function unbindAll () {
        unbindFunctions.map(unbind => unbind());
        unbindFunctions = [];
    }

    function createBinding (obj, key, pathArray) {
        if (typeof key === 'string') {
            key = [key];
        }
        function onValueListener (dbObj) {
            if (typeof dbObj === 'object' && dbObj !== null) {
                for (var i = 0 ; i<key.length;i++) {
                    obj[key[i]] = dbObj[key[i]];
                }
            }
        }

        function commiter (dbObj) {
            var v,
                k,
                modified = false;
            for (var i = 0 ; i<key.length;i++) {
                k = key[i];
                v = obj[k];
                if (dbObj[k] !== obj[k]) {
                    //prevent values to be undefined because firebase does not handle undefined value
                    dbObj[k] = v === undefined ? false : v;
                    modified = true;
                }
            }
            return modified;
        }

        singleton.customBind(commiter, onValueListener, pathArray);

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

    singleton.lockView = function () {
        dbRootObj.locked = true;
        dbRootObj.$save();
    };

    singleton.unlockView = function () {
        dbRootObj.locked = false;
        //commit changes which happened during the period of lock
        commit();
        dbRootObj.$save();
    };

    singleton.isLocked = function () {
        return dbRootObj && !!dbRootObj.locked;
    };

    singleton.isAuthor = function () {
        return dbRootObj && dbRootObj.camera;
    };

    singleton.getOtherViewersId = function () {
        if (dbRootObj && dbRootObj.viewers) {
            var list = Object.keys(dbRootObj.viewers);
            var index = list.indexOf(singleton.auth.uid);
            if (index > -1) {
                list.splice(index,1);
            }
            return list;
        }
        return [];
    };

    singleton.isLastModifier = function () {
        return singleton.auth && singleton.auth.uid === dbRootObj.lastModifiedBy;
    };

    singleton.commit = commit;

    singleton.loadState = function (state) {
        loadingNewView = true;
        onValue(state, 'root');
    };

    return function () {return singleton;};

})();

angular.module('atlasDemo').service('firebaseView',[ '$rootScope', '$location', '$firebaseObject', '$firebaseAuth', 'volumesManager', 'mainApp', 'loadingManager', 'crosshair', 'undoRedoManager', function ($root, $location, $firebaseObject, $firebaseAuth, volumesManager, mainApp, loadingManager, crosshair, undoRedoManager) {
    'use strict';
    var fv = FirebaseView();
    fv.setLoadingManager(loadingManager);
    fv.setLocation($location);
    fv.setRootScope($root);
    fv.setFirebase($firebaseObject, $firebaseAuth);
    fv.setMainApp(mainApp);
    fv.setUndoRedoManager(undoRedoManager);
    volumesManager.setFirebaseView(fv);
    crosshair.setFirebaseView(fv);
    undoRedoManager.setFirebaseView(fv);
    return fv;
}]);
