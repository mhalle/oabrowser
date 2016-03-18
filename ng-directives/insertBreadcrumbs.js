
angular.module('atlasDemo').directive( 'insertBreadcrumbs', function () {
    return {
        restrict: 'A',
        scope: {},
        templateUrl : "ng-templates/breadcrumbs.html",
        controller: function ( $scope, $element, mainApp ) {
            $scope.data = {
                    breadcrumbs : []
                };
            mainApp.on('insertBreadcrumbs', function (breadcrumbs) {
                $scope.data = {
                    breadcrumbs : breadcrumbs
                };
                $scope.$apply();
            });
        }
    };
});
