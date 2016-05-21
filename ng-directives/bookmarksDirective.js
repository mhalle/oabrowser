angular.module('atlasDemo').directive( 'bookmarks', function () {
    return {
        restrict: 'EA',
        templateUrl: 'ng-templates/bookmarks.html',
        scope: {},
        controller: ['$scope', '$element', 'mainApp', 'firebaseView', function ( $scope, $element, mainApp, firebaseView ) {

            var alreadyFetched = {
                thumbnail : {},
                annotation : {}
            };

            $scope.imgPlaceholder = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9InllcyI/PjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgcHJlc2VydmVBc3BlY3RSYXRpbz0ibm9uZSI+PCEtLQpTb3VyY2UgVVJMOiBob2xkZXIuanMvNjR4NjQKQ3JlYXRlZCB3aXRoIEhvbGRlci5qcyAyLjYuMC4KTGVhcm4gbW9yZSBhdCBodHRwOi8vaG9sZGVyanMuY29tCihjKSAyMDEyLTIwMTUgSXZhbiBNYWxvcGluc2t5IC0gaHR0cDovL2ltc2t5LmNvCi0tPjxkZWZzPjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI+PCFbQ0RBVEFbI2hvbGRlcl8xNTRiY2NlYmEwNCB0ZXh0IHsgZmlsbDojQUFBQUFBO2ZvbnQtd2VpZ2h0OmJvbGQ7Zm9udC1mYW1pbHk6QXJpYWwsIEhlbHZldGljYSwgT3BlbiBTYW5zLCBzYW5zLXNlcmlmLCBtb25vc3BhY2U7Zm9udC1zaXplOjEwcHQgfSBdXT48L3N0eWxlPjwvZGVmcz48ZyBpZD0iaG9sZGVyXzE1NGJjY2ViYTA0Ij48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIGZpbGw9IiNFRUVFRUUiLz48Zz48dGV4dCB4PSIxNC41IiB5PSIzNi41Ij42NHg2NDwvdGV4dD48L2c+PC9nPjwvc3ZnPg==";

            $scope.bookmarks = {};

            $scope.noBookmark = true;

            $scope.firebaseView = firebaseView;

            $scope.newBookmark = {};


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

            function fetchAllThumbnails (specificId) {
                var uid;

                function createCallback (id) {
                    function callback (thumbnail) {
                        $scope.bookmarks[id] = $scope.bookmarks[id] || {};
                        $scope.bookmarks[id].thumbnail = thumbnail;
                        $scope.safeApply();
                    }
                    return callback;
                }
                if (specificId && $scope.bookmarksObject[specificId] && !alreadyFetched.thumbnail[specificId] ) {
                    firebaseView.getViewThumbnail(specificId, createCallback(specificId), true);
                    alreadyFetched.thumbnail[specificId] = true;
                    $scope.noBookmark = false;
                }
                else {
                    for (uid in $scope.bookmarksObject) {
                        if ($scope.bookmarksObject[uid] && !alreadyFetched.thumbnail[uid]) {
                            firebaseView.getViewThumbnail(uid, createCallback(uid), true);
                            alreadyFetched.thumbnail[uid] = true;
                        }
                        $scope.noBookmark = false;
                    }
                }
            }


            function fetchAllAnnotations (specificId) {
                var uid;

                function createCallback (id) {
                    function callback (annotation) {
                        $scope.bookmarks[id] = $scope.bookmarks[id] || {};
                        $scope.bookmarks[id].annotation = annotation;
                        $scope.safeApply();
                    }
                    return callback;
                }
                if (specificId && $scope.bookmarksObject[specificId] && !alreadyFetched.annotation[specificId] ) {
                    firebaseView.getBookmarkAnnotation(specificId, createCallback(specificId));
                    alreadyFetched.annotation[specificId] = true;
                    $scope.noBookmark = false;
                }
                else {
                    for (uid in $scope.bookmarksObject) {
                        if ($scope.bookmarksObject[uid] && !alreadyFetched.annotation[uid]) {
                            firebaseView.getBookmarkAnnotation(uid, createCallback(uid));
                            alreadyFetched.annotation[uid] = true;
                        }
                        $scope.noBookmark = false;
                    }
                }
            }

            function fetchBookmarks () {

                function onValue (val) {
                    $scope.bookmarksObject = val;
                    fetchAllThumbnails();
                    fetchAllAnnotations();
                }
                function onChildChanged (val, key) {
                    if (val) {
                        //in case child changed event arrive before value
                        if (!$scope.bookmarksObject) {
                            $scope.bookmarksObject = {};
                        }
                        $scope.bookmarksObject[key] = val;
                        fetchAllThumbnails(key);
                        fetchAllAnnotations(key);
                    }
                    else {
                        $scope.bookmarksObject[key] = undefined;
                        $scope.bookmarks[key] = undefined;
                        //undefined is not enough for angular
                        delete $scope.bookmarks[key];
                        delete $scope.bookmarksObject[key];
                        if ( Object.keys($scope.bookmarks).length === 0) {
                            $scope.noBookmark = true;
                        }
                        $scope.safeApply();
                    }
                }
                firebaseView.getUserBookmarks(onValue, onChildChanged);
            }

            mainApp.on('firebaseView.connectionSetup', fetchBookmarks);

            $scope.openBookmarks = function () {
                $('#bookmarksModal').modal('show');
            };

            $scope.openNewBookmark = function () {
                $('#newBookmarkModal').modal('show');
            };

            $scope.shareBookmark = function (key) {
                $('#bookmarksModal').modal('hide');
                mainApp.emit('bookmarks.shareBookmark', key);
            };

            $scope.closeBookmarks = function () {
                $('#bookmarksModal').modal('hide');
            };

            $scope.closeNewBookmark = function () {
                $('#newBookmarkModal').modal('hide');
            };

            $scope.loadBookmark = function (bookmarkId) {
                $scope.closeBookmarks();
                firebaseView.loadBookmark(bookmarkId);
            };

            $scope.emptyForm = function () {
                $scope.newBookmark.title = undefined;
                $scope.newBookmark.description = undefined;
                delete $scope.newBookmark.title;
                delete $scope.newBookmark.description;
                $scope.safeApply();
            };

            $scope.createBookmark = function () {
                firebaseView.saveBookmark($scope.newBookmark.title, $scope.newBookmark.description);
                $scope.emptyForm();
                $scope.closeNewBookmark();
            };


        }]
    };
});
