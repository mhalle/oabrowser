angular.module('atlasDemo').controller('HeaderCtrl', function ($scope, mainApp) {

    $scope.data = {
        title : "",
        source : "#"
    };

    mainApp.on('headerData', function (header) {
        $scope.data.title = header.name;
        $scope.data.source = header.contact;
        $scope.$apply();
    });
});
