angular.module('atlasDemo').directive( 'messages', function () {
    return {
        restrict: 'EA',
        templateUrl: 'ng-templates/messages.html',
        scope: {},
        controller: ['$scope', '$element', 'mainApp', 'firebaseView', function ( $scope, $element, mainApp, firebaseView ) {

            $scope.messages = {};
            $scope.noMessage = true;
            $scope.firebaseView = firebaseView;
            $scope.unreadMessages = 0;
            $scope.activeTab = 0;
            $scope.sentMessages = {};
            $scope.noSentMessage = true;

            moment.locale(navigator.language || 'en');

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

            $scope.emptyForm = function () {
                $scope.newMessage = {};
            };

            $scope.send = function () {
                var i;

                // only send if there is at least one recipient
                if (!$scope.newMessage.recipient || $scope.newMessage.recipient.length === 0) {
                    return;
                }


                for (i = 0; i < $scope.newMessage.recipient.length; i++) {
                    firebaseView.sendMessage($scope.newMessage.recipient[i].uid, $scope.newMessage.subject, $scope.newMessage.text);
                }
                firebaseView.registerSentMessage($scope.newMessage.recipient, $scope.newMessage.subject, $scope.newMessage.text);
                $scope.emptyForm();
            };

            function initMessages (messages) {
                $scope.messages = messages.val();
                $scope.noMessage = Object.keys(messages).length === 0;
                $scope.unreadMessages = 0;
                var messageId;

                for (messageId in $scope.messages) {

                    $scope.messages[messageId].text = parseTextMessage($scope.messages[messageId].text);

                    if ($scope.messages[messageId].unread) {
                        $scope.unreadMessages++;
                    }

                }
                $scope.safeApply();
            }

            mainApp.on('firebaseView.messages', initMessages);

            function initSentMessages (messages) {
                $scope.sentMessages = messages.val();
                $scope.noSentMessage = Object.keys(messages).length === 0;
                var messageId;

                for (messageId in $scope.sentMessages) {

                    $scope.sentMessages[messageId].text = parseTextMessage($scope.sentMessages[messageId].text);

                }
                $scope.safeApply();
            }

            mainApp.on('firebaseView.sentMessages', initSentMessages);

            $scope.deleteMessage = function (key, type) {

                if (type === 'sent') {
                    $scope.sentMessages[key] = undefined;
                    delete $scope.sentMessages[key];
                    $scope.noSentMessage = Object.keys($scope.sentMessages).length === 0;
                }
                else {
                    $scope.messages[key] = undefined;
                    delete $scope.messages[key];
                    $scope.noMessage = Object.keys($scope.messages).length === 0;
                }

                $scope.safeApply();

                firebaseView.deleteMessage(key, type);
            };

            function initUserNames (userNames) {
                $scope.userNames = userNames.val();
                $scope.userNamesList = [];
                var uid;
                for (uid in $scope.userNames) {
                    if ($scope.userNames[uid].name && $scope.userNames[uid].name.length > 0) {
                        $scope.userNames[uid].uid = uid;
                        $scope.userNamesList.push($scope.userNames[uid]);
                    }
                }
                $scope.safeApply();
            }
            mainApp.on('firebaseView.userNames', initUserNames);

            $scope.openNewMessageForm = function () {
                $('#newMessageModal').modal('show');
            };

            $scope.openMessagesList = function () {
                $scope.unreadMessages = 0;
                $('#messagesListModal').modal('show');
                firebaseView.markAllMessagesAsRead();
            };

            $scope.closeMessagesList = function () {
                $('#messagesListModal').modal('hide');
            };

            function createBookmarkMessage (key) {
                $scope.newMessage = $scope.newMessage || {};
                $scope.newMessage.recipient = undefined;
                delete $scope.newMessage.recipient;
                $scope.newMessage.subject = "Check out this view";
                $scope.newMessage.text = 'Click [here]("bookmark://'+key+'") to load the bookmark.';
                $scope.safeApply();
                $scope.openNewMessageForm();
            }
            mainApp.on('bookmarks.shareBookmark', createBookmarkMessage);


            function parseTextMessage (s) {
                //a link to a bookmark has a structure inspired from markdown : [text of the link]("bookmark://bookmarkuid")
                var regexp = /\[(.*?)\]\("bookmark:\/\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})"\)/g;
                //escape the html chars
                s = s.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                //replace the link pattern with a javascript link to load the bookmark
                s = s.replace(regexp, (m, p1, p2) =>'<a ng-click="loadBookmark(\''+p2+'\')">'+p1+'</a>');
                return s;
            }

            $scope.isMessageEnabled = function () {
                return firebaseView.auth && !firebaseView.auth.isAnonymous;
            };

            $scope.loadBookmark = function (bookmarkId) {
                $scope.closeMessagesList();
                firebaseView.loadBookmark(bookmarkId);
            };

            $scope.formatDate = function (timestamp) {
                if (Date.now()-timestamp < 24*60*60*1000) {
                    return moment(timestamp).fromNow();
                }
                return moment(timestamp).calendar();
            };

            $scope.getMatchingUserNames = function ($query) {
                return $scope.userNamesList.filter(o => o.name.toLowerCase().indexOf($query.toLowerCase()) !== -1).sort((a,b) => a.name > b.name);
            };

        }]
    };
});
