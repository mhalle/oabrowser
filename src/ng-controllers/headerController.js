const angular = require('angular');

angular.module('atlasDemo').controller('HeaderCtrl',['$scope', 'mainApp', function ($scope, mainApp) {

    $scope.data = {
        title : "",
        source : "#"
    };

    mainApp.on('headerData', function (header) {
        $scope.data.title = header.name;
        $scope.data.source = header.contact;
        $scope.$apply();
    });
}]);
