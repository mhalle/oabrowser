const angular = require('angular');
const templateUrl = require('../ng-templates/modalContent.html');

angular.module('atlasDemo').controller('ModalDemoCtrl', ['$scope', '$uibModal', function ($scope, $uibModal) {

    $uibModal.open({
        animation: true,
        templateUrl: templateUrl,
        controller: 'ModalInstanceCtrl',
        resolve: {}
    });



}]);

// Please note that $uibModalInstance represents a modal window (instance) dependency.
// It is not the same as the $uibModal service used above.

angular.module('atlasDemo').controller('ModalInstanceCtrl', ['$scope', '$uibModalInstance', '$rootScope', 'mainApp', 'loadingManager', function ($scope, $uibModalInstance, $rootScope, mainApp, loadingManager) {

    $scope.loadingJSON = true;
    $scope.loadingVTK = false;
    $scope.loadingHierarchy = false;

    $scope.loadedVTKFiles = 0;
    $scope.numberOfVTKFiles = 1;

    $scope.backgroundFiles = [];
    $scope.backgroundDone = false;

    $scope.done = false;

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

    mainApp.on('loadingManager.atlasStructureLoaded', function () {
        $scope.loadingJSON = false;
        $scope.loadingVTK = true;
        $scope.numberOfVTKFiles = loadingManager.totalNumberOfModels;
        $scope.safeApply();
    });

    mainApp.on('loadingManager.modelLoaded', function () {
        $scope.loadedVTKFiles = loadingManager.numberOfModelsLoaded;
        if ($scope.loadedVTKFiles === $scope.numberOfVTKFiles) {
            $scope.loadingVTK = false;
            $scope.loadingHierarchy = true;
        }
        $scope.safeApply();
    });

    mainApp.on('modal.hierarchyLoaded', function () {
        $scope.loadingHierarchy = false;
        $scope.done = true;
        $scope.safeApply();
    });

    mainApp.on('loadingManager.volumeStart', function (datasource) {
        $scope.backgroundFiles.push({
            datasource : datasource,
            progress : 0
        });
        $scope.safeApply();
    });

    mainApp.on('loadingManager.volumeLoaded', function (datasource) {
        var backgroundObject = $scope.backgroundFiles.find(o => o.datasource === datasource);
        backgroundObject.progress = 100;
        var everyBackgroundLoadingFinished = $scope.backgroundFiles.every(o => o.progress === 100);
        if (everyBackgroundLoadingFinished) {
            $scope.backgroundDone = true;
        }
        $scope.safeApply();
    });

    mainApp.on('loadingManager.volumeProgress', function (event) {
        var backgroundObject = $scope.backgroundFiles.find(o => o.datasource === event.datasource);
        if (!backgroundObject) {
            backgroundObject = {
                datasource : event.datasource
            };
            $scope.backgroundFiles.push(backgroundObject);
        }
        if (backgroundObject.progress !== event.progress) {
            backgroundObject.progress = event.progress;
            $scope.safeApply();
        }
    });

    $scope.ok = function () {
        $uibModalInstance.close(true);
    };
    /*
    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
    */
}]);
