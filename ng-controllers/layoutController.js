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

    $scope.forceUpdate = function () {
        $timeout(function () {
            $scope.updateDisplay();
            mainApp.emit('ui.layout.resize');
        },10);
    };


    $scope.toggle = function (which) {
        $scope.layout[which] = !$scope.layout[which];
        $scope.forceUpdate();
    };

    $scope.close = function (which) {
        $scope.layout[which] = true;
        $scope.forceUpdate();
    };

    $scope.open = function (which) {
        $scope.layout[which] = false;
        $scope.forceUpdate();
    };

    $scope.$on('ui.layout.toggle', function (e, c) {
        //refresh scope value (binding is not done by the library)
        var id = (c.element.attr('id') || '').split('');
        if (id.length > 0) {
            id.splice(-9);
            $scope.layout[id.join('')] = c.collapsed;
        }
        mainApp.emit('ui.layout.toggle', $scope);
        $scope.forceUpdate();
    });

    $scope.$on('ui.layout.resize', function () {
        mainApp.emit('ui.layout.resize', $scope);
    });

    mainApp.on('ui.layout.forcedUpdate', function () {
        $scope.forceUpdate();
    });

    mainApp.on('ui.layout.hideLeftSide', function () {
        $scope.close('leftSide');
    });

}]);
