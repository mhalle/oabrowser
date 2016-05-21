angular.module('atlasDemo').controller('LayoutController', ['$scope', '$timeout', 'mainApp', function($scope, $timeout, mainApp) {
    $scope.config = {
        flow: 'column'
    };


    $scope.layout = {
        bottom: false,
        rightSide: false,
        leftSide: false
    };

    $scope.safeApply = function(fn) {
        //if scope has been destroyed, ie if modal has been dismissed, $root is null
        if (this.$root) {
            var phase = this.$root.$$phase;
            if(phase === '$apply' || phase === '$digest') {
                if(fn && (typeof(fn) === 'function')) {
                    fn();
                }
            } else {
                this.$apply(fn);
            }
        }
    };


    $scope.toggle = function (which) {
        $scope.layout[which] = !$scope.layout[which];
    };

    $scope.close = function (which) {
        $scope.layout[which] = true;
    };

    $scope.open = function (which) {
        $scope.layout[which] = false;
    };

    $scope.$on('ui.layout.toggle', function () {
        mainApp.emit('ui.layout.toggle', $scope);
    });

    $scope.$on('ui.layout.resize', function () {
        mainApp.emit('ui.layout.resize', $scope);
    });

    mainApp.on('ui.layout.forcedUpdate', function () {
        $timeout(function () {
            $scope.updateDisplay();
            mainApp.emit('ui.layout.resize');
        },10);
    });

    mainApp.on('ui.layout.hideLeftSide', function () {
        var element = angular.element('body > div.stretch.ui-layout-row > div:nth-child(3) > div > div:nth-child(2) > a:nth-child(1) > span');
        element.mousedown();
        element.mouseup();
        element.click();
        $timeout(function () {
            mainApp.emit('ui.layout.forcedUpdate');
        },10);
    });

}]);
