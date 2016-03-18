angular.module('atlasDemo').controller('LayoutController', function($scope) {
    $scope.config = {
        flow: 'column'
    };


    $scope.layout = {
        bottom: false,
        rightSide: false,
        leftSide: false
    };


    $scope.toggle = function(which) {
        $scope.layout[which] = !$scope.layout[which];
    };

    $scope.close = function(which) {
        $scope.layout[which] = true;
    };

    $scope.open = function(which) {
        $scope.layout[which] = false;
    };

    $scope.$on('ui.layout.toggle', function(){

    });

});
