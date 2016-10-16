require("jquery");
require("jquery-mousewheel");

require("inobounce");
require('angular');
require("angular-sanitize");
require("angular-animate");
require("angularfire");

// strange bug in requiring the module itself
require("adapt-strap/dist/adapt-strap.js");
require("adapt-strap/dist/adapt-strap.tpl.js");
require("adapt-strap/dist/adapt-strap.css");

require("bootstrap");
require("bootstrap/dist/css/bootstrap.css");

require("angular-ui-layout");
require("angular-ui-layout/src/ui-layout.css");
require("./ng-templates/treeNode.html");

require('ng-tags-input');
require('ng-tags-input/build/ng-tags-input.css');
require('ng-tags-input/build/ng-tags-input.bootstrap.css');

require("./libs/rzslicer.js");
require("./libs/rzslicer.css");

require("./libs/three/TrackballControls.js");
require("./libs/three/VTKLoader.js");
require("./libs/three/STLLoader.js");
require("./libs/three/Detector.js");
require("./libs/three/NRRDLoader.js");

require("./libs/ui-bootstrap-tpls-1.3.1.min.js");

require("./libs/MTLLoader.js");
require("./libs/OBJLoader.js");
require("./libs/Volume.js");
require("./libs/VolumeSlice.js");
require("./libs/MultiVolumesSlice.js");

require("./angularInit.js");
require("./ng-providers/mainAppProvider.js");
require("./ng-providers/atlasJsonProvider.js");
require("./ng-providers/objectSelectorProvider.js");
require("./ng-providers/volumesManagerProvider.js");
require("./ng-providers/loadingManagerProvider.js");
require("./ng-providers/crosshairProvider.js");
require("./ng-providers/screenshotSceneProvider.js");
require("./ng-providers/undoRedoManagerService.js");
require("./ng-providers/firebaseViewService.js");

require("./ng-filters/toArrayFilter.js");

require("./ng-directives/compileDirective.js");
require("./ng-directives/insertTreeDirective.js");
require("./ng-directives/insertBreadcrumbs.js");
require("./ng-directives/insertSliceDirective.js");
require("./ng-directives/bookmarksDirective.js");
require("./ng-directives/messagesDirective.js");
require("./ng-directives/mainToolbarDirective.js");
require("./ng-directives/sceneCrosshairDirective.js");
require("./ng-directives/confirmationModalDirective.js");

require("./ng-controllers/layoutController.js");
require("./ng-controllers/modalController.js");
require("./ng-controllers/headerController.js");
require("./ng-controllers/loginModalController.js");

require("./app.js");

// require("./libs/font-awesome/css/font-awesome.min.css");
require("./style.css");