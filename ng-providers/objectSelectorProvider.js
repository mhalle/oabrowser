angular.module('atlasDemo').provider('objectSelector', ['mainAppProvider', function (mainAppProvider) {

    var mainApp = mainAppProvider.$get();
    var selectedObjects = [],
        selectedHierarchy = null,
        highlightMeshColor = (new THREE.Color('rgb(255,239,0)')).getHex(),
        singleton = {};

    function _select (object) {

        if (object instanceof THREE.Object3D) {

            object.originalColor = object.material.color.getHex();
            object.material.color.setHex(highlightMeshColor);

        }
        else if (object instanceof HierarchyGroup) {

            for (var i = 0; i < object.children.length; i++) {

                _select(object.children[i]);

            }

        }
        else {

            throw 'The given object is not selectable';

        }

        object.selected = true;
    }

    function _unselect (object) {

        if (object instanceof THREE.Object3D) {

            object.material.color.setHex(object.originalColor);

        }
        else if (object instanceof HierarchyGroup) {

            for (var i = 0; i < object.children.length; i++) {

                _unselect(object.children[i]);

            }

        }

        object.selected = false;
    }

    function select (object) {

        clearSelection();
        _select(object);
        selectedObjects = [object];

    }

    function clearSelection () {

        for (var i = 0; i < selectedObjects.length; i++) {
            _unselect(selectedObjects[i]);
        }
        selectedObjects = [];

    }

    function addToSelection (object) {

        if (!object.selected) {
            _select(object);
            selectedObjects.push(object);
        }

    }

    function removeFromSelection (object) {

        if (object.selected) {

            var index = selectedObjects.indexOf(object);
            if (index > -1) {

                selectedObjects.splice(index,1);
                _unselect(object);

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
            if (value instanceof THREE.Object3D || value instanceof HierarchyGroup) {
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


    this.$get = function () {
        return singleton;
    };
}]);
