
angular.module('atlasDemo').directive( 'insertBreadcrumbs', function () {
    return {
        restrict: 'A',
        scope: {},
        templateUrl : "templates/breadcrumbs.html"
        controller: function ( $scope, $element, $rootScope ) {
        $scope = {
        data : {
        breadcrumbs : []
    }
};
                                      $rootScope.$on('insertBreadcrumbs', function (event, breadcrumbs) {
    $scope.data = {
        breadcrumbs : breadcrumbs
    };
    $scope.$apply();
});
}
};
});