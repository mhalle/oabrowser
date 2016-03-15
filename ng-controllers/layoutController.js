angular.module('atlasDemo').controller('LayoutController', function($scope, $timeout) {
    $scope.config = {
        flow: 'column'
    };


    $scope.layout = {
        bottom: true,
        rightSide: true,
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
    }

    $scope.$on('ui.layout.loaded', function(evt, id){
        console.error('loaded', typeof id, id)
        if (id === null) {
            $timeout(function(){
                $scope.cloak = false;
            }, 500)
        } else {
            $timeout(function(){
                $scope.layout.one = true;
                $scope.layout.top = true;
            });
        }

    });

    $scope.$on('ui.layout.toggle', function(){

    });
});
