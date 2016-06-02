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
        userRelatedUnbindFunctions = [],
        bindObjects = [],
        loadingNewView = true,
        loadingManager,
        initiated = false,
        createdView = false,
        namespaces = {},
        undoRedoManager;

    singleton.setRootScope = function (root) {
        if (!$root) {
            $root = root;
        }
    };

    singleton.setLocation = function (location) {
        if (!$location) {
            $location = location;
        }
    };

    singleton.setFirebase = function (firebaseObject, firebaseAuth) {
        if (!$firebaseAuth && !$firebaseObject) {
            $firebaseObject = firebaseObject;
            $firebaseAuth = firebaseAuth;
        }

    };

    singleton.setMainApp = function (mA) {
        if (!mainApp) {
            mainApp = mA;
            mainApp.on('loadingManager.loadingEnd', init);
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

    function generateToken() {
        var characters = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','?','!'],
            length = 64,
            i,
            r = '';

        for (i = 0; i < length; i++) {
            r += characters[Math.floor(Math.random()*64)];
        }

        return r;
    }

    function setNewPath () {
        if ($location) {
            uuid = generateUUID();
            var currentPath = $location.path(),
                viewRegExp = /view\/[\w-]+/,
                path;
            if (viewRegExp.test(currentPath)) {
                path = $location.path().replace(viewRegExp, 'view/'+uuid);
            }
            else {
                path = 'view/'+uuid+'/'+currentPath;
            }
            path = path.replace('//','/');
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

        function registerLastModification () {
            if (singleton.auth) {
                dbRootObj.lastModifiedBy = singleton.auth.uid;
                dbRootObj.lastModifiedAt = Date.now();
            }
        }

        namespaces.root.commiters.push(registerLastModification);

        //always try to add himself as author
        function addHimselfAsAuthor () {

            //add himself to the list of authors
            if (!dbRootObj.authors || singleton.auth && !dbRootObj.authors[singleton.auth.uid]) {
                dbRootObj.authors = dbRootObj.authors || {};
                dbRootObj.authors[singleton.auth.uid] = true;
            }
        }
        namespaces.authors.commiters.push(addHimselfAsAuthor);

        initRootListenersAndCommiters.done = true;
    }

    function authAnonymously (ref) {
        unbindAllUserRelatedCallbacks();
        if (!singleton.auth) {
            ref.authAnonymously(function(error, authData) {
                if (error) {
                    console.log("Authentication Failed!", error);
                } else {
                    console.log("Authenticated successfully with payload:", authData);
                    singleton.auth = authData;
                    loadViewerConnection();
                    loadUserConnection();
                    loadMessagesConnection();
                    loadUserNamesConnection();
                }
            });
        }
        else {
            loadViewerConnection();
            loadUserConnection();
            loadMessagesConnection();
            loadUserNamesConnection();
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

    function loadUserConnection () {
        if (!singleton.auth || !singleton.auth.uid) {
            return ;
        }
        var ref = new Firebase("https://atlas-viewer.firebaseio.com/users/"+singleton.auth.uid);

        ref.once('value', function(snapshot) {
            //reload the connection if one of the author give him the edition rights
            var val = snapshot.val();
            if (!val) {
                //user did not existed and need to be created
                var user = {};
                user.tmp_token = sessionStorage.getItem('firebase.token') || null;
                var newToken = generateToken();
                sessionStorage.setItem('firebase.token', newToken);
                user.token = newToken;
                if (singleton.auth.provider && singleton.auth.provider !== 'anonymous') {
                    user.name = singleton.auth[singleton.auth.provider].displayName || null;
                    user.profileImageURL = singleton.auth[singleton.auth.provider].profileImageURL || null;
                    user.email = singleton.auth[singleton.auth.provider].email || null;
                }
                user.modified = Firebase.ServerValue.TIMESTAMP;
                ref.set(user);
            }
            else {
                var currentToken = sessionStorage.getItem('firebase.token') || null;
                if (currentToken !== val.token) {
                    val.tmp_token = currentToken;
                    sessionStorage.setItem('firebase.token', val.token);
                    val.modified = Firebase.ServerValue.TIMESTAMP;
                    ref.set(val);
                }
            }
        });

    }

    function loadViewerConnection () {
        var viewerRef = new Firebase("https://atlas-viewer.firebaseio.com/views/"+uuid+"/viewers/"+singleton.auth.uid);

        //simple boolean to know if user is online
        var amOnline = new Firebase('https://atlas-viewer.firebaseio.com/.info/connected');

        amOnline.on('value', function(snapshot) {
            if (snapshot.val()) {
                viewerRef.onDisconnect().remove();
                viewerRef.set({
                    lastUpdate : Firebase.ServerValue.TIMESTAMP,
                    token : sessionStorage.getItem('firebase.token'), //useful to pass the author right
                    name : singleton.auth && singleton.auth.provider !== 'anonymous' && singleton.auth[singleton.auth.provider].displayName || null
                });
            }
        });

        viewerRef.on('value', function(snapshot) {
            //reload the connection if one of the author give him the edition rights
            var val = snapshot.val();
            if (val && val.author) {
                loadDatabaseConnection();
            }
        });

        var done = false;
        function unbind () {
            if (!done) {
                viewerRef.remove();
                amOnline.off();
                done = true;
            }
        }
        unbindFunctions.push(unbind);
        userRelatedUnbindFunctions.push(unbind);
    }

    function loadAuthorConnection () {
        var ref = new Firebase("https://atlas-viewer.firebaseio.com/authors/"+uuid);

        function commit () {
            //add himself to the list of authors
            var token = sessionStorage.getItem('firebase.token');
            var obj = {};
            obj[token] = true;
            ref.update(obj);
        }
        createNamespace('authors');
        namespaces.authors.commiters.push(commit);

        function unbind () {
            // remove commiter from the list when connection change (another one will be created)
            var index = namespaces.authors.commiters.indexOf(commit);
            if (index > -1) {
                namespaces.authors.commiters.splice(index,1);
            }
        }
        unbindFunctions.push(unbind);
    }

    function loadMessagesConnection () {
        var messagesRef = new Firebase("https://atlas-viewer.firebaseio.com/messages/"+singleton.auth.uid);

        messagesRef.on('value', function(snapshot) {
            if (snapshot.val()) {
                mainApp.emit('firebaseView.messages', snapshot);
            }
        });

        messagesRef.on('child_added', function(snapshot) {
            if (snapshot.val()) {
                mainApp.emit('firebaseView.newMessage', snapshot);
            }
        });


        function unbind () {
            messagesRef.off();
        }
        userRelatedUnbindFunctions.push(unbind);
    }

    function loadUserNamesConnection () {
        var userNamesRef = new Firebase("https://atlas-viewer.firebaseio.com/userNames/");

        userNamesRef.on('value', function(snapshot) {
            if (snapshot.val()) {
                mainApp.emit('firebaseView.userNames', snapshot);
            }
        });

        userNamesRef.on('child_added', function(snapshot) {
            mainApp.emit('firebaseView.newUserName', snapshot);
        });

        userNamesRef.on('child_removed', function(snapshot) {
            mainApp.emit('firebaseView.userNameDeleted', snapshot);
        });

        userNamesRef.on('child_changed', function(snapshot) {
            mainApp.emit('firebaseView.userNameChanged', snapshot);
        });

        if (singleton.auth && singleton.auth.uid && singleton.auth.provider !== 'anonymous') {
            var userNameRef = new Firebase("https://atlas-viewer.firebaseio.com/userNames/"+singleton.auth.uid);
            userNameRef.set({
                name : singleton.auth[singleton.auth.provider].displayName || null,
                profileImageURL : singleton.auth[singleton.auth.provider].profileImageURL || null
            });
        }

        function unbind () {
            userNamesRef.off();
        }
        userRelatedUnbindFunctions.push(unbind);
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


        ref.on('value', function (snapshot) {
            onValue(snapshot, 'root');
        });

        //wait for the next animation frame to be sure that dbRootObject has the right value
        ref.on('child_changed', function (snapshot) {
            setTimeout(function () {
                onValue(snapshot, snapshot.key());
            },100);
        });

        singleton.auth = ref.getAuth();
        authAnonymously(ref);


        ref.onAuth(authHandler);

        loadAuthorConnection();
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

        mainApp.emit('firebaseView.connectionSetup');

    }

    function commit (namespace) {
        if (dbRootObj && !dbRootObj.locked) {
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
            else if (singleton.auth && singleton.auth.uid !== dbRootObj.lastModifiedBy || loadingNewView) {
                // if we are loading a new view, child changed is not called and therefore we need to call every listeners on value
                if (namespace === 'root' && loadingNewView) {
                    undoRedoManager.saveState(snapshot, namespace, dbRootObj.lastModifiedAt);
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
            else if (singleton.auth && singleton.auth.uid === dbRootObj.lastModifiedBy && namespace !== 'root' && namespace !== 'viewers' && namespace !== 'sceneCrosshair' && namespace !== 'authors' && namespace !== 'crosshair') {
                undoRedoManager.saveState(snapshot, namespace, dbRootObj.lastModifiedAt);
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

    function unbindAllUserRelatedCallbacks () {
        userRelatedUnbindFunctions.map(unbind => unbind ());
        userRelatedUnbindFunctions = [];
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
        if (!dbRootObj) {
            return;
        }
        dbRootObj.locked = true;
        dbRootObj.$save();
    };

    singleton.unlockView = function () {
        if (!dbRootObj) {
            return;
        }
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

    singleton.loadState = function (state, namespace, timestamp) {
        loadingNewView = true;
        onValue(state, namespace);
        //commit the loaded state to propagate new state
        if (namespace !== 'root') {
            dbRootObj[namespace] = state.val();
            dbRootObj.lastModifiedAt = timestamp;
            dbRootObj.lastModifiedBy = singleton.auth.uid;
            dbRootObj.$save();
        }
        else {
            singleton.ref.set(state.val());
        }
    };

    singleton.authWithProvider = function (provider) {
        var authObj = $firebaseAuth(singleton.ref);
        authObj.$authWithOAuthPopup(provider).then(function(authData) {
            console.log("Logged in as:", authData.uid);
            singleton.auth = authData;
            loadUserConnection();
            loadViewerConnection();
            loadMessagesConnection();
            loadUserNamesConnection();
        }).catch(function(error) {
            console.error("Authentication failed:", error);
        });
    };

    singleton.unauth = function () {
        singleton.ref.unauth();
    };

    singleton.getViewThumbnail = function (viewId, callback, isBookmark) {
        var type = isBookmark ? 'bookmarks/' : 'views/';
        var ref = new Firebase("https://atlas-viewer.firebaseio.com/"+type+viewId+"/screenshot/base64");

        ref.on('value', function (snapshot) {
            var val = snapshot.val();
            callback(val);
        });
    };

    singleton.getBookmarkAnnotation = function (viewId, callback) {
        var ref = new Firebase("https://atlas-viewer.firebaseio.com/bookmarks/"+viewId+"/annotation");

        ref.on('value', function (snapshot) {
            var val = snapshot.val();
            callback(val);
        });
    };

    singleton.getUserBookmarks = function (valueCallback, childCallback) {
        if (singleton.auth) {
            var ref = new Firebase("https://atlas-viewer.firebaseio.com/users/"+singleton.auth.uid+"/bookmarks");
            ref.once('value', function (snapshot) {
                var val = snapshot.val();
                valueCallback(val);
            });

            ref.on('child_changed', function (snapshot) {
                childCallback(snapshot.val(), snapshot.key());
            });

            ref.on('child_added', function (snapshot) {
                childCallback(snapshot.val(), snapshot.key());
            });

            ref.on('child_removed', function (oldSnapshot) {
                childCallback(false, oldSnapshot.key());
            });
        }
    };

    singleton.saveBookmark = function (title, description) {
        var bookmarkUuid = generateUUID();

        function copyCurrentView() {
            //copy the current view in a new
            singleton.ref.once('value', function (snapshot) {
                var bookmarkRef = new Firebase("https://atlas-viewer.firebaseio.com/bookmarks/"+bookmarkUuid);
                var view = snapshot.val();
                view.bookmarkedBy = singleton.auth && singleton.auth.uid;
                view.annotation = {
                    title : title,
                    description : description
                };
                bookmarkRef.set(view);
            });
        }

        //wait for the screenshot to be updated to copy the current view (should be short)
        mainApp.once('screenshotScene.commited', copyCurrentView);


        //register the bookmark in the user profile
        var ref = new Firebase("https://atlas-viewer.firebaseio.com/users/"+singleton.auth.uid+"/bookmarks");
        ref.once('value', function (snapshot) {
            var value = snapshot.val() || {};
            value[bookmarkUuid] = true;
            ref.set(value);
        });

        //require screenshot
        mainApp.emit('firebaseView.requireScreenshot');

    };

    singleton.deleteBookmark = function (viewId) {
        if (viewId && typeof viewId === 'string' && viewId.length >0) {
            var ref = new Firebase("https://atlas-viewer.firebaseio.com/users/"+singleton.auth.uid+"/bookmarks/"+viewId);
            ref.remove();
        }
    };

    singleton.loadBookmark = function (bookmarkUuid) {
        var bookmarkRef = new Firebase("https://atlas-viewer.firebaseio.com/bookmarks/"+bookmarkUuid);
        bookmarkRef.once('value', function (snapshot) {
            singleton.loadState(snapshot, 'root');
        });
    };

    singleton.sendMessage = function (recipient, subject, text) {
        var messageId = generateUUID();
        var messageRef = new Firebase("https://atlas-viewer.firebaseio.com/messages/"+recipient+"/"+messageId);
        var messageObject = {
            author : singleton.auth.uid,
            text : text,
            subject : subject,
            date : Firebase.ServerValue.TIMESTAMP,
            unread : true
        };
        messageRef.set(messageObject);

    };

    singleton.registerSentMessage = function (recipients, subject, text) {
        if (!singleton.auth || singleton.auth.provider === 'anonymous') {
            return;
        }
        var messageId = generateUUID();
        var messageRef = new Firebase("https://atlas-viewer.firebaseio.com/sent-messages/"+singleton.auth.uid+"/"+messageId);
        var messageObject = {
            recipients : recipients.map(r => r.name),
            text : text,
            subject : subject,
            date : Firebase.ServerValue.TIMESTAMP
        };
        messageRef.set(messageObject);
    };

    singleton.deleteMessage = function (messageId) {
        if (messageId && typeof messageId === 'string' && messageId.length >0) {
            var ref = new Firebase("https://atlas-viewer.firebaseio.com/messages/"+singleton.auth.uid+"/"+messageId);
            ref.remove();
        }
    };

    singleton.markAllMessagesAsRead = function () {
        var ref = new Firebase("https://atlas-viewer.firebaseio.com/messages/"+singleton.auth.uid);
        ref.once('value', function (snapshot) {
            var val = snapshot.val();
            if (val) {
                for (var messageId in val) {
                    val[messageId].unread = false;
                }
                ref.set(val);
            }
        });
    };

    return function () {return singleton;};

})();

angular.module('atlasDemo').service('firebaseView',[ '$rootScope', '$location', '$firebaseObject', '$firebaseAuth', 'volumesManager', 'mainApp', 'loadingManager', 'crosshair', 'undoRedoManager', 'screenshotScene', function ($root, $location, $firebaseObject, $firebaseAuth, volumesManager, mainApp, loadingManager, crosshair, undoRedoManager, screenshotScene) {
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
    screenshotScene.setFirebaseView(fv);
    return fv;
}]);
