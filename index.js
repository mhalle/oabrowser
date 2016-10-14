require("jquery");

require("inobounce");
require('angular');
require("angular-sanitize");
require("angular-animate");

require("adapt-strap/dist/adapt-strap.min.js");
require("adapt-strap/dist/adapt-strap.tpl.min.js");
require("angularfire");
require("angular-ui-layout");
require("./libs/rzslicer.js");

require("bootstrap");

require("./libs/three/TrackballControls.js");
require("./libs/three/VTKLoader.js");
require("./libs/three/STLLoader.js");
require("./libs/three/Detector.js");
require("./libs/three/NRRDLoader.js");

require("./libs/MTLLoader.js");
require("./libs/OBJLoader.js");

require("./libs/jquery.mousewheel.js");
require("./libs/ui-bootstrap-tpls-1.3.1.min.js");
require("./libs/ng-tags/ng-tags-input.min.js");

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

require("bootstrap/dist/css/bootstrap.css");
require("adapt-strap/dist/adapt-strap.min.css");
require("angular-ui-layout/src/ui-layout.css");
require("./libs/rzslicer.css");
require("./libs/ng-tags/ng-tags-input.min.css");
require("./libs/ng-tags/ng-tags-input.bootstrap.min.css");
require("./libs/font-awesome/css/font-awesome.min.css");
require("./style.css");