angular.module('atlasDemo').controller('ModalDemoCtrl', function ($scope, $uibModal) {

    $uibModal.open({
        animation: true,
        templateUrl: 'ng-templates/modalContent.html',
        controller: 'ModalInstanceCtrl',
        resolve: {}
    });



});

// Please note that $uibModalInstance represents a modal window (instance) dependency.
// It is not the same as the $uibModal service used above.

angular.module('atlasDemo').controller('ModalInstanceCtrl', function ($scope, $uibModalInstance, $rootScope, mainApp) {

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

    mainApp.on('modal.JSONLoaded', function (numberOfVTKFiles) {
        $scope.loadingJSON = false;
        $scope.loadingVTK = true;
        $scope.numberOfVTKFiles = numberOfVTKFiles;
        $scope.safeApply();
    });

    mainApp.on('modal.fileLoaded', function (loaded) {
        $scope.loadedVTKFiles = loaded;
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

    mainApp.on('volumesManager.loadingStart', function (filename) {
        $scope.backgroundFiles.push({
            filename : filename,
            progress : 0
        });
        $scope.safeApply();
    });

    mainApp.on('volumesManager.loadingEnd', function (filename) {
        var backgroundObject = $scope.backgroundFiles.find(o => o.filename === filename);
        backgroundObject.progress = 100;
        var everyBackgroundLoadingFinished = $scope.backgroundFiles.every(o => o.progress === 100);
        if (everyBackgroundLoadingFinished) {
            $scope.backgroundDone = true;
        }
        $scope.safeApply();
    });

    mainApp.on('volumesManager.loadingProgress', function (event) {
        var backgroundObject = $scope.backgroundFiles.find(o => o.filename === event.filename);
        if (!backgroundObject) {
            backgroundObject = {
                filename : event.filename
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
});
