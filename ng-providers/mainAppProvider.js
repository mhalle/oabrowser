angular.module('atlasDemo').provider("mainApp", function () {

    var seletedObject = null,
        selectedHierarchy = null,
        singleton = {
            globalParameters : window.globalViewerParameters
        },
        listeners = {};

    Object.defineProperty(singleton, 'selectedObject', {
        get :  function () {
            return seletedObject;
        },
        set : function (value) {
            seletedObject = value;
        }
    });
    Object.defineProperty(singleton, 'selectedHierarchy', {
        get :  function () {
            return selectedHierarchy;
        },
        set : function (value) {
            selectedHierarchy = value;
        }
    });

    singleton.createEvent = function (eventName) {

        if (!listeners[eventName]) {
            listeners[eventName] = [];
        }

    };

    singleton.on = function (eventName, callback, context) {

        if (!listeners[eventName]) {
            singleton.createEvent(eventName);
        }
        var listener = {
            callback : callback,
            context : context
        };

        listeners[eventName].push(listener);

    };

    singleton.off = function (eventName, callback) {

        if (listeners[eventName]) {
            var index = listeners[eventName].findIndex(function (listener) {
                return listener.callback === callback;
            });
            listeners[eventName].splice(index, 1);
        }

    };

    singleton.emit = function (eventName, event) {

        var i,
            listener;

        if (!listeners[eventName]) {

            singleton.createEvent(eventName);
        }

        for (i = 0; i < listeners[eventName]; i++) {

            listener = listeners[eventName][i];
            listener.callback.call(listener.context || null, event);

        }

    };


    this.$get = function () {
        return singleton;
    };
});
