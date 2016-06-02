angular.module('atlasDemo').provider('objectSelector', ['mainAppProvider', function (mainAppProvider) {

    var mainApp = mainAppProvider.$get();
    var selectedObjects = [],
        selectedHierarchy = null,
        highlightMeshColor = (new THREE.Color('rgb(255,239,0)')).getHex(),
        singleton = {};

    function _select (object) {

        var mesh = object.mesh;
        if (object['@type'] === 'Structure') {

            if (!mesh.originalColor) {
                mesh.originalColor = mesh.material.color.getHex();
            }
            mesh.material.color.setHex(highlightMeshColor);

        }
        else if (object['@type'] === 'Group') {

            for (var i = 0; i < object.member.length; i++) {

                removeFromSelection(object.member[i]);
                _select(object.member[i]);

            }

        }
        else {

            throw 'The given object is not selectable';

        }

        object.selected = true;
    }

    function _unselect (object) {

        if (object['@type'] === 'Structure') {

            object.mesh.material.color.setHex(object.mesh.originalColor);

        }
        else if (object['@type'] === 'Group') {

            for (var i = 0; i < object.member.length; i++) {

                _unselect(object.member[i]);

            }

        }

        object.selected = false;
    }

    function select (object) {

        clearSelection();
        _select(object);
        selectedObjects = [object];
        mainApp.emit('objectSelected', object);

    }

    function clearSelection () {

        for (var i = 0; i < selectedObjects.length; i++) {
            _unselect(selectedObjects[i]);
        }
        selectedObjects = [];
        mainApp.emit('selectionCleared');

    }

    function addToSelection (object) {

        if (!object.selected) {
            _select(object);
            selectedObjects.push(object);
            mainApp.emit('objectAddedToSelection', selectedObjects);
        }

    }

    function removeFromSelection (object) {

        if (object.selected) {

            var index = selectedObjects.indexOf(object);
            if (index > -1) {

                selectedObjects.splice(index,1);
                _unselect(object);
                mainApp.emit('objectRemovedFromSelection', selectedObjects);

            }
        }
    }

    singleton.select = select;
    singleton.clearSelection = clearSelection;
    singleton.addToSelection = addToSelection;
    singleton.removeFromSelection = removeFromSelection;


    Object.defineProperty(singleton, 'selectedObjects', {
        get :  function () {
            return selectedObjects;
        },
        set : function (value) {
            if (value['@type'] === 'structure' || value['@type'] === 'Group') {
                select(value);
            }
            else if (value instanceof Array) {
                clearSelection();
                for (var i = 0; i < value.length; i++) {
                    addToSelection(value[i]);
                }

            }
            else {
                throw 'Type error : please check the type of the object you want to select';
            }
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

    function updateSelectedMeshesColor () {
        for (var i = 0; i < selectedObjects.length; i++) {
            _select(selectedObjects[i]);
        }
    }

    Object.defineProperty(singleton, 'highlightMeshColor', {
        get : function () {
            return '#'+highlightMeshColor.toString(16);
        },
        set : function (stringColor) {
            highlightMeshColor = parseInt(stringColor.substr(1),16);
            updateSelectedMeshesColor();
        }
    });

    this.$get = function () {
        return singleton;
    };
}]);
