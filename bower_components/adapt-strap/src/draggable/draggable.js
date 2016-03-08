
angular.module('adaptv.adaptStrap.draggable', [])
  .directive('adDrag', ['$rootScope', '$parse', '$timeout', function ($rootScope, $parse, $timeout) {
    function linkFunction(scope, element, attrs) {
      scope.draggable = attrs.adDrag;
      scope.hasHandle = attrs.adDragHandle === 'false' || typeof attrs.adDragHandle === 'undefined' ? false : true;
      scope.onDragStartCallback = $parse(attrs.adDragBegin) || null;
      scope.onDragEndCallback = $parse(attrs.adDragEnd) || null;
      scope.useClonedElement = attrs.adDragCloneElement === 'true';
      scope.data = null;

      var offset, mx, my, tx, ty;

      var hasTouch = ('ontouchstart' in document.documentElement);
      /* -- Events -- */
      var startEvents = 'touchstart mousedown';
      var moveEvents = 'touchmove mousemove';
      var endEvents = 'touchend mouseup';

      var $document = $(document);
      var $window = $(window);

      var dragEnabled = false;
      var pressTimer = null;

      var draggedClone = null;

      function reset() {
        var elem = scope.useClonedElement ? draggedClone : element;
        elem.css({ left: '', top: '', position:'', 'z-index': '' });
        var width = elem.data('ad-draggable-temp-width');

        if (width) {
          elem.css({ width: width });
        } else {
          elem.css({ width: '' });
        }
        elem.children()
          .each(function() {
            var width = $(this).data('ad-draggable-temp-width');
            if (width) {
              $(this).css({width: width});
            } else {
              $(this).css({width: ''});
            }
          });
      }

      function moveElement(x, y) {
        var elem = scope.useClonedElement ? draggedClone : element;
        elem.css({
          left: x,
          top: y,
          position: 'fixed',
          'z-index': 99999
        });
      }

      function onDragStart(evt, o) {
        if (o.el === element && o.callback) {
          o.callback(evt);
        }
      }

      function onDragEnd(evt, o) {
        if (o.el === element && o.callback) {
          o.callback(evt);
        }
      }

      function onDragBegin(evt) {
        if (!scope.onDragStartCallback) {
          return;
        }
        var elem = scope.useClonedElement ? draggedClone : element;
        scope.$apply(function () {
          scope.onDragStartCallback(scope, {
            $data: scope.data,
            $dragElement: { el: elem },
            $event: evt
          });
        });
      }

      function onDragComplete(evt) {
        if (!scope.onDragEndCallback) {
          return;
        }
        var elem = scope.useClonedElement ? draggedClone : element;
        // To fix a bug issue where onDragEnd happens before
        // onDropEnd. Currently the only way around this
        // Ideally onDropEnd should fire before onDragEnd
        $timeout(function() {
          scope.$apply(function () {
            scope.onDragEndCallback(scope, {
              $data: scope.data,
              $dragElement: { el: elem },
              $event: evt
            });
          });
        }, 100);
      }

      function onMove(evt) {
        var cx, cy;
        if (!dragEnabled) {
          return;
        }
        evt.preventDefault();

        cx = (evt.pageX || evt.originalEvent.touches[0].pageX);
        cy = (evt.pageY || evt.originalEvent.touches[0].pageY);

        tx = (cx - mx) + offset.left - $window.scrollLeft();
        ty = (cy - my) + offset.top - $window.scrollTop();

        cx = cx - $window.scrollLeft();
        cy = cy - $window.scrollTop();

        moveElement(tx, ty);
        var elem = scope.useClonedElement ? draggedClone : element;
        $rootScope.$broadcast('draggable:move', {
          x: mx,
          y: my,
          tx: tx,
          ty: ty,
          cx: cx,
          cy: cy,
          el: elem,
          data: scope.data
        });
      }

      function onRelease(evt) {
        if (!dragEnabled) {
          return;
        }
        evt.preventDefault();
        var elem = scope.useClonedElement ? draggedClone : element;
        $rootScope.$broadcast('draggable:end', {
          x: mx,
          y: my,
          tx: tx,
          ty: ty,
          el: elem,
          data: scope.data,
          callback: onDragComplete
        });
        if (scope.useClonedElement) {
          element.removeClass('ad-dragging');
          elem.remove();
        } else {
          elem.removeClass('ad-dragging');
        }
        reset();
        $document.off(moveEvents, onMove);
        $document.off(endEvents, onRelease);
      }

      function onEnableChange(newVal) {
        dragEnabled = scope.$eval(newVal);
      }

      function onDragDataChange(newVal) {
        scope.data = newVal;
      }

      function getInlineProperty (prop, element) {
        var styles = $(element).attr('style'),
          value;
        if (styles) {
          styles.split(';').forEach(function (e) {
            var style = e.split(':');
            if ($.trim(style[0]) === prop) {
              value = style[1];
            }
          });
        }
        return value;
      }

      function persistElementWidth() {
        var elem = scope.useClonedElement ? draggedClone : element;
        if (getInlineProperty('width', elem)) {
          elem.data('ad-draggable-temp-width', getInlineProperty('width', elem));
        }
        elem.width(elem.width());
        elem.children().each(function () {
          if (getInlineProperty('width', this)) {
            $(this).data('ad-draggable-temp-width', getInlineProperty('width', this));
          }
          $(this).width($(this).width());
        });
      }

      function onLongPress(evt) {
        if (!dragEnabled) {
          return;
        }
        evt.preventDefault();
        if (scope.useClonedElement) {
          draggedClone = element.clone().appendTo(element.parent());
          draggedClone.css({position: 'fixed'});
        }

        var elem = scope.useClonedElement ? draggedClone : element;
        offset = element.offset();

        if (scope.hasHandle) {
          offset = element.find('.ad-drag-handle').offset();
        } else {
          offset = element.offset();
        }

        element.addClass('ad-dragging');

        mx = (evt.pageX || evt.originalEvent.touches[0].pageX);
        my = (evt.pageY || evt.originalEvent.touches[0].pageY);

        tx = offset.left - $window.scrollLeft();
        ty = offset.top - $window.scrollTop();

        persistElementWidth();
        moveElement(tx, ty);

        $document.on(moveEvents, onMove);
        $document.on(endEvents, onRelease);

        $rootScope.$broadcast('draggable:start', {
          x: mx,
          y: my,
          tx: tx,
          ty: ty,
          el: elem,
          data: scope.data,
          callback: onDragBegin
        });
      }

      function cancelPress() {
        clearTimeout(pressTimer);
        $document.off(moveEvents, cancelPress);
        $document.off(endEvents, cancelPress);
      }

      /*
       * When the element is clicked start the drag behaviour
       * On touch devices as a small delay so as not to prevent native window scrolling
       */
      function onPress(evt) {
        if (!dragEnabled) {
          return;
        }
        if ($(evt.target).is('[ad-prevent-drag]') || $(evt.target).parents('[ad-prevent-drag]').length > 0) {
          return;
        }
        if (hasTouch) {
          cancelPress();
          pressTimer = setTimeout(function() {
            cancelPress();
            onLongPress(evt);
          }, 100);

          $document.on(moveEvents, cancelPress);
          $document.on(endEvents, cancelPress);
        } else {
          onLongPress(evt);
          return false;
        }
      }

      function toggleListeners(enable) {
        if (!enable) {
          return;
        }
        // add listeners.
        scope.$on('$destroy', function () { toggleListeners(false); });
        attrs.$observe('adDrag', onEnableChange);
        scope.$watch(attrs.adDragData, onDragDataChange);

        scope.$on('draggable:start', onDragStart);
        scope.$on('draggable:end', onDragEnd);

        if (scope.hasHandle) {
          element.on(startEvents, '.ad-drag-handle', onPress);
        } else {
          element.on(startEvents, onPress);
          element.addClass('ad-draggable');
        }
      }

      function init() {
        element.attr('draggable', 'false'); // prevent native drag
        toggleListeners(true);
      }

      init();
    }
    return {
      restrict: 'A',
      link: linkFunction
    };
  }])
  .directive('adDrop', ['$rootScope', '$parse', function ($rootScope, $parse) {
    function linkFunction(scope, element, attrs) {
      scope.droppable = attrs.adDrop;
      scope.onDropCallback = $parse(attrs.adDropEnd) || null;
      scope.onDropOverCallback = $parse(attrs.adDropOver) || null;
      scope.onDropLeaveCallback = $parse(attrs.adDropLeave) || null;

      var dropEnabled = false;
      var elem = null;
      var lastDropElement = null;
      var $window = $(window);

      function getCurrentDropElement(x, y) {
        var bounds = element.offset();
        // set drag sensitivity
        var vthold = Math.floor(element.outerHeight() / 6);

        x = x + $window.scrollLeft();
        y = y + $window.scrollTop();

        return ((y >= (bounds.top + vthold) && y <= (bounds.top + element.outerHeight() - vthold)) &&
        (x >= (bounds.left) && x <= (bounds.left + element.outerWidth()))) && (x >= bounds.left &&
        x <= (bounds.left + element.outerWidth())) ? element : null;
      }

      function onEnableChange(newVal) {
        dropEnabled = scope.$eval(newVal);
      }

      function onDropChange(evt, obj) {
        if (elem !== obj.el) {
          elem = null;
        }
      }

      function onDragMove(evt, obj) {
        if (!dropEnabled) {
          return;
        }
        // If the dropElement and the drag element are the same
        if (element === obj.el) {
          return;
        }

        var el = getCurrentDropElement(obj.cx, obj.cy);

        if (el !== null) {
          elem = el;
          lastDropElement = elem;
          obj.el.lastDropElement = elem;
          scope.$apply(function() {
            scope.onDropOverCallback(scope, {
              $data: obj.data,
              $dragElement: { el: obj.el },
              $dropElement: { el: elem },
              $event: evt
            });
          });
          element.addClass('ad-drop-over');

          $rootScope.$broadcast('draggable:change', {
            el: elem
          });
        } else {
          if (obj.el.lastDropElement === element) {
            scope.$apply(function() {
              scope.onDropLeaveCallback(scope, {
                $data: obj.data,
                $dragElement: { el: obj.el },
                $dropElement: { el: obj.el.lastDropElement },
                $event: evt
              });
            });
            obj.el.lastDropElement.removeClass('ad-drop-over');
            delete obj.el.lastDropElement;
            //elem = null;
          }
        }
      }

      function onDragEnd(evt, obj) {
        if (!dropEnabled) {
          return;
        }
        // call the adDrop element callback
        // Callback should fire only once
        if (elem) {
          scope.$apply(function () {
            scope.onDropCallback(scope, {
              $data: obj.data,
              $dragElement: { el: obj.el },
              $dropElement: { el: elem }, // Current drop element over
              $lastDropElement: { el: lastDropElement }, // Track the previous valid drop element dragged over
              $event: evt
            });
          });
        }
        elem = null;
        lastDropElement = null;
      }

      function toggleListeners(enable) {
        if (!enable) {
          return;
        }
        // add listeners.
        attrs.$observe('adDrop', onEnableChange);
        scope.$on('$destroy', function () { toggleListeners(false); });

        scope.$on('draggable:move', onDragMove);
        scope.$on('draggable:end', onDragEnd);
        scope.$on('draggable:change', onDropChange);
      }

      function init() {
        toggleListeners(true);
      }

      init();
    }
    return {
      restrict: 'A',
      link: linkFunction
    };
  }]);
