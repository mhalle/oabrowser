
angular.module('atlasDemo').directive( 'insertTree', function ( $compile ) {
    return {
        restrict: 'A',
        scope: { text: '@' },
        controller: function ( $scope, $element, mainApp ) {
            console.log('event listener registred');
            mainApp.on('insertTree', function (hierarchy) {
                console.log('event received', hierarchy);
                var template = document.getElementById('treeListDirective').innerHTML;
                $scope.data = {
                    root : hierarchy
                };
                var el = $compile( template )( $scope );
                $element.append( el );
            });
        }
    };
});
