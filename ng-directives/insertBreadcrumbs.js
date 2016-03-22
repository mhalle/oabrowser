
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
                    }
                }
                addParents(object, []);
                return result;
            }

            $scope.data = {
                breadcrumbs : []
            };

            $scope.select = function (object) {

                objectSelector.select(object);

            };

            mainApp.on('mouseOverObject', function (object) {
                if (object) {
                    var breadcrumbs = getAllTheHierarchyPaths(object);
                    $scope.data.breadcrumbs = breadcrumbs;
                }
                else {
                    $scope.data.breadcrumbs = $scope.data.selectedBreadcrumbs;
                }
                $scope.$apply();
            });

            mainApp.on('objectSelected', function (object) {
                var selectedBreadcrumbs = getAllTheHierarchyPaths(object);
                $scope.data.selectedBreadcrumbs = selectedBreadcrumbs;
            });
        }
    };
}]);
