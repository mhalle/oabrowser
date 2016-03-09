angular.module('atlasDemo').controller('HeaderCtrl', function ($scope, $rootScope) {

    $scope.data = {
        title : "",
        source : "#"
    }

    $rootScope.$on('headerData', function (event, header) {
        $scope.data.title = header.name;
        $scope.data.source = header.contact;
        $scope.$apply();
    });
});
