
angular.module('atlasDemo').directive( 'insertBreadcrumbs', ['objectSelector', function (objectSelector) {
    return {
        restrict: 'A',
        scope: {},
        templateUrl : "ng-templates/breadcrumbs.html",
        controller: function ( $scope, $element, mainApp ) {

            function getAllTheHierarchyPaths(object) {
                var result = [];
                function addParents (object, path) {
                    if (object.hierarchyParents.length === 0) {
                        path.push(object);
                        result.push(path);
                        return path;
                    }
                    for (var i = 0; i < object.hierarchyParents.length; i++) {
                        var parent = object.hierarchyParents[i];
                        var p = addParents(parent, path.slice());
                        p.push(object);
                        return p;
                    }
                }
                addParents(object, []);
                result = result.map(list => list.map(x => x.atlasStructure));
                return result;
            }

            function getPathFromSelectionList (selectionList) {
                var r = [];
                for (var i = 0; i < selectionList.length; i++) {
                    r.push.apply(r, getAllTheHierarchyPaths(selectionList[i].mesh));
                }
                return r;
            }

            $scope.data = {
                breadcrumbs : []
            };

            $scope.select = function (object) {

                objectSelector.select(object);

            };

            $scope.safeApply = function(fn) {
                var phase = this.$root.$$phase;
                if(phase === '$apply' || phase === '$digest') {
                    if(fn && (typeof(fn) === 'function')) {
                        fn();
                    }
                } else {
                    this.$apply(fn);
                }
            };

            mainApp.on('mouseOverObject', function (object) {
                if (object) {
                    var breadcrumbs = getAllTheHierarchyPaths(object);
                    $scope.data.breadcrumbs = breadcrumbs;
                }
                else {
                    $scope.data.breadcrumbs = $scope.data.selectedBreadcrumbs;
                }
                $scope.safeApply();
            });

            mainApp.on('objectSelected', function (object) {
                var selectedBreadcrumbs = getAllTheHierarchyPaths(object.mesh);
                $scope.data.selectedBreadcrumbs = selectedBreadcrumbs;
                $scope.data.breadcrumbs = $scope.data.selectedBreadcrumbs;
                $scope.safeApply();
            });

            mainApp.on('selectionCleared', function () {
                $scope.data.selectedBreadcrumbs = [];
                $scope.data.breadcrumbs = $scope.data.selectedBreadcrumbs;
                $scope.safeApply();
            });

            mainApp.on('objectRemovedFromSelection', function (selectionList) {
                $scope.data.selectedBreadcrumbs = getPathFromSelectionList(selectionList);
                $scope.data.breadcrumbs = $scope.data.selectedBreadcrumbs;
                $scope.safeApply();
            });

            mainApp.on('objectAddedToSelection', function (selectionList) {
                $scope.data.selectedBreadcrumbs = getPathFromSelectionList(selectionList);
                $scope.data.breadcrumbs = $scope.data.selectedBreadcrumbs;
                $scope.safeApply();
            });
        }
    };
}]);
