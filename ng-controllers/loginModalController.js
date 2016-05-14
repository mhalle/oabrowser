angular.module('atlasDemo').controller('LoginModalController', ['$scope', '$uibModalInstance', 'firebaseView', function ($scope, $uibModalInstance, firebaseView) {


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

    $scope.auth = function (provider) {
        firebaseView.authWithProvider(provider);
        $scope.ok();
    };

    $scope.ok = function () {
        $uibModalInstance.close(true);
    };
    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
}]);
