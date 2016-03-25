angular.module('atlasDemo').provider('atlasJson', [function () {

    var ids,
        uuidRegExp,
        resolveQueue,
        resolvedList,
        objectsByType;

    function initVariables () {
        ids = {};
        uuidRegExp = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
        resolveQueue = [];
        resolvedList = [];
        objectsByType = {
            header : null,
            structure : [],
            group : [],
            datasource : [],
            selector : []
        };
    }

    function registerIds (objectList) {
        ids = {};
        var length = objectList.length,
            i,
            object;
        for (i = 0; i < length; i++) {
            object = objectList[i];
            ids[object['@id']] = object;
        }
    }

    function resolveReferences (object) {

        var key,
            value,
            retrieved;

        if (!object._resolved) {
            for (key in object) {
                value = object[key];
                if (key[0] !== '@') {
                    if (Array.isArray(value) && typeof value[0] === 'string' && value[0].match(uuidRegExp)) {
                        for (var i = 0; i < value.length; i++) {
                            retrieved = ids[value[i]];
                            value[i] = retrieved;
                            if (!retrieved._resolved) {
                                resolveQueue.push(retrieved);
                            }
                        }
                    }
                    else if (typeof value === 'string' && value.match(uuidRegExp)) {
                        retrieved = ids[value];
                        object[key] = retrieved;
                        if (!retrieved._resolved) {
                            resolveQueue.push(retrieved);
                        }
                    }
                    else if (typeof value === 'object') {
                        if (!value._resolved) {
                            resolveQueue.push(value);
                        }
                    }
                }
            }
            object._resolved = true;
            resolvedList.push(object);
            addObjectToTypeList(object);
        }
    }

    function cleanObjects () {
        var length = resolvedList.length,
            i;
        for (i = 0; i < length; i++) {
            delete resolvedList[i]._resolved;
        }
    }

    function addObjectToTypeList (object) {
        var type = object['@type'];
        if (type && Array.isArray(type)) {
            for (var i = 0; i < type.length; i++) {
                var t = type[i];
                (objectsByType[t] ||(objectsByType[t] = [])).push(object);
            }
        }
        else if (typeof type === 'string') {
            if (type === 'header') {
                if (objectsByType.header) {
                    throw 'Error : There can only be one header';
                }
                objectsByType.header = object;
            }
            else {
                (objectsByType[type] ||(objectsByType[type] = [])).push(object);
            }
        }
    }

    function parse (atlasObject) {
        if (typeof atlasObject === 'string') {
            atlasObject = JSON.parse(atlasObject);
        }
        initVariables();
        registerIds(atlasObject);
        resolveQueue = atlasObject.slice();
        var objectToParse;
        while ((objectToParse = resolveQueue.pop()) && objectToParse) {
            resolveReferences(objectToParse);
        }
        cleanObjects();
        objectsByType.all = atlasObject;
        return objectsByType;

    }

    function replaceByReferences (object) {
        var key,
            value,
            reference;

        //delete properties that could have been added by the application

        delete object.mesh;
        delete object.open;
        delete object.visible;

        for(key in object) {
            value = object[key];
            if (Array.isArray(value) && typeof value[0] === 'object' && value[0]['@id']) {
                for (var i = 0; i < value.length; i++) {
                    reference = value[i]['@id'];
                    value[i] = reference;
                }
            }
            else if (typeof value === 'object' && value['@id']) {
                reference = value['@id'];
                object[key] = reference;
            }
            else if (typeof value === 'object') {
                replaceByReferences(value);
            }
        }
    }

    function stringify (atlas, map, espace) {
        map = map || null;
        espace = espace || 0;
        var result;
        if (Array.isArray(atlas)) {
            //flat atlas

            result = atlas;

        }
        else if (atlas.all) {
            //argument matches this.parse return value
            result = atlas.all;
        }
        for (var i = 0; i < result.length; i++) {
            replaceByReferences(result[i]);
        }
        return JSON.stringify(result, map, espace);
    }

    this.$get = function () {
        return {parse : parse, stringify : stringify};
    };
}]);
