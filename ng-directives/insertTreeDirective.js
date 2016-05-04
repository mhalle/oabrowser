
angular.module('atlasDemo').directive( 'insertTree', function ( $compile ) {
    return {
        restrict: 'A',
        scope: { text: '@' },
        controller: ['$scope', '$element', 'mainApp', 'objectSelector', function ( $scope, $element, mainApp, objectSelector ) {
            $scope.select = function (item) {
                if (item.selected) {
                    objectSelector.removeFromSelection(item);
                }
                else {
                    objectSelector.addToSelection(item);
                }
            };

            mainApp.on('insertTree', function (hierarchy) {
                var template = document.getElementById('treeListDirective').innerHTML;
                $scope.data = {
                    root : {members : hierarchy }
                };
                var el = $compile( template )( $scope );
                $element.append( el );
            });
        }]
    };
});
