const angular = require('angular');
const LightKit = require('./LightKit');
const dat = require('dat-gui');
const HierarchyGroup = require('./HierarchyGroup');
const Stats = require('../libs/three/stats.min.js');
const TWEEN = require('tween.js');
const Detector = require('../libs/three/Detector');
const throttle = require('throttle-debounce').throttle;


if (!Detector.webgl) {
    Detector.addGetWebGLMessage();
}

angular.module('atlasDemo')
    .config(['$uibTooltipProvider', function ($uibTooltipProvider) {
        // disable tooltips on mobile devices
        var touch = 'ontouchstart' in document.documentElement;
        if (touch){
             $uibTooltipProvider.options({trigger: 'dontTrigger'});
        }
        }])
    .run(["mainApp", "objectSelector", "atlasJson", "volumesManager", "firebaseView", "loadingManager", 
        function (mainApp, objectSelector, atlasJson, volumesManager, firebaseView, loadingManager) {

    var container,
        stats,
        camera,
        controls,
        scene,
        renderer,
        mouse,
        raycaster,
        meshesList = [],
        meshesAndSlicesList = [],
        needPickupUpdate,
        resizeTimeout = setTimeout(function () {}),
        gui,
        container2,
        renderer2,
        camera2,
        axes2,
        scene2,
        header,
        mousedownDate,
        mousedownPosition = new THREE.Vector2(0,0),
        containerOffset,
        lightKit;

    //remove the wait message displayed on slow connection before the script load
    $('#waitMessage').remove();

    mainApp.on('loadingManager.newMesh', function (mesh) {
        meshesList.push(mesh);
        meshesAndSlicesList.push(mesh);
        scene.add(mesh);
    });

    mainApp.on('loadingManager.everyModelLoaded', function () {
        //put it in an immediate timeout to give the browser the opportunity to refresh the modal
        setTimeout(createHierarchy, 0);
    });

    mainApp.on('loadingManager.atlasStructureLoaded', function (atlasStructure) {
        header = atlasStructure.Header;
    });

    // Firebase doesn't like otherwise-not-special characters in its attribute names,
    // so convert to base64 if needed. Note that URL quoting isn't quite enough,
    // because "." is a special character for firebase.
    function encodeFirebaseAttribute(str) {
        var disallowed = /[#\.[\]$\/]/;
        if (disallowed.test(str)) {
            return encodeURIComponent(str.replace('.', '%2e'));
        }
        else {
            return str;
        }
    }
    
    function bindHierarchyItemWithFirebase (item) {
        //fireobject can not sync properties starting with _ so we have to make a proxy
        if (item.visibleInTree === undefined) {
            Object.defineProperty(item, 'visibleInTree', {
                get : function () {
                    return !!item._ad_expanded;
                },
                set : function (value) {
                    item._ad_expanded = !!value;
                }
            });
        }

        var safeItemId = encodeFirebaseAttribute(item['@id']);

        //firebase binding for selection, visibility and visibility in tree
        firebaseView.bind(item, ['selected', 'visibleInTree'], `models.${safeItemId}.mesh`);

        //do not bind 'visible' property with group because they will fetch their 
        //property from their child
        if (item['@type'] !== 'Group') {
            firebaseView.bind(item.mesh, ['visible'], `models.${safeItemId}.mesh`);
        }
    }

    function getMesh(item) {

        if (item['@type']==='Group') {
            var childrenMeshes = item.member.map(getMesh);
            //HierarchyGroup is used instead of THREE.Group because THREE.Group 
            // does not allow children to have multiple parents
            item.mesh = new HierarchyGroup();
            item.mesh.atlasStructure = item;
            for (var i = 0; i< childrenMeshes.length; i++) {
                try {
                    item.mesh.add(childrenMeshes[i]);
                }
                catch (e) {
                    console.log(e);
                }
            }
        }

        bindHierarchyItemWithFirebase(item);

        return item.mesh;
    }

    function createHierarchy() {
        var rootGroups = header.root;
        rootGroups.map(getMesh);

        mainApp.emit('insertTree',rootGroups);

        //send a signal to the modal
        mainApp.emit('modal.hierarchyLoaded');
    }

    function finishSceneSetup() {

        if (finishSceneSetup.done) {
            return;
        }
        // renderer

        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();

        renderer = new THREE.WebGLRenderer({
            antialias : window.globalViewerParameters.antialias || false,
            alpha : true,
            preserveDrawingBuffer : true,
            logarithmicDepthBuffer : window.globalViewerParameters.logarithmicDepthBuffer || false
        });
        renderer.setClearColor( 0x000000, 0 );
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( container.clientWidth, container.clientHeight );

        container.appendChild( renderer.domElement );

        // setup stats
        stats = new Stats();
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.top = '0px';
        container.appendChild( stats.domElement );

        //save slices mesh in a list with model meshes for the pickup feature
        mainApp.on('insertSlice', function (data) {
            if (!meshesAndSlicesList.includes(data.slice.mesh)) {
                meshesAndSlicesList.push(data.slice.mesh);
            }
        });

        //setup resize feature

        //debounce resize to keep it fluid
        function setResizeTimeout () {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(onWindowResize, 100);
        }

        window.addEventListener( 'resize', setResizeTimeout);
        mainApp.on('ui.layout.resize', setResizeTimeout);
        mainApp.on('ui.layout.toggle', setResizeTimeout);


        //register events for the pickup and selection
        container.addEventListener('mousemove', onSceneMouseMove, false);
        container.addEventListener('mousedown', onSceneMouseDown);
        container.addEventListener('mouseup', onSceneMouseUp);
        container.addEventListener('mouseleave', onSceneLeaveWindow);

        container.addEventListener('wheel', throttle(250, firebaseView.commit), false);
        container.addEventListener('mousemove', throttle(250, firebaseView.commit), false);


        //init offset
        containerOffset = $(container).offset();

        //start animating the 3D view
        animate();

        //start the binding of the camera
        initFirebase();

        finishSceneSetup.done = true;

    }

    function init() {

        container = document.getElementById('rendererFrame');

        //set position according to global parameters
        var distanceToOrigin = window.globalViewerParameters.cameraInitialDistanceToOrigin || 300;

        camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.05, distanceToOrigin*15 );

        var initialPosition = window.globalViewerParameters.cameraInitialPositionVector || [0,0,1];
        camera.position.x = distanceToOrigin * initialPosition[0];
        camera.position.y = distanceToOrigin * initialPosition[1];
        camera.position.z = distanceToOrigin * initialPosition[2];

        //set up vector according to global parameters
        var initialUp = window.globalViewerParameters.cameraInitialUpVector || [0,1,0];
        camera.up.x = initialUp[0];
        camera.up.y = initialUp[1];
        camera.up.z = initialUp[2];

        mainApp.camera = camera;

        controls = new THREE.TrackballControls( camera, container );

        controls.rotateSpeed = 10.0;
        controls.zoomSpeed = 5;
        controls.panSpeed = 2;

        controls.noZoom = false;
        controls.noPan = false;

        controls.staticMoving = true;
        controls.dynamicDampingFactor = 0.3;

        scene = new THREE.Scene();
        volumesManager.setScene(scene);
        mainApp.scene = scene;

        scene.add( camera );

        mouse = new THREE.Vector2();
        raycaster = new THREE.Raycaster();

        // light

        /* simple light was replaced by lightkit
        var dirLight = new THREE.DirectionalLight( 0xffffff );
        dirLight.position.set( 200, 200, 1000 ).normalize();

        camera.add( dirLight );
        camera.add( dirLight.target );
        */

        lightKit = new LightKit(camera, controls, scene);

        //fetch atlas structure
		var atlasStructurePath = (window.localStorage.getItem('atlasStructureToLoad') || 
                            window.globalViewerParameters && 
                            window.globalViewerParameters.atlasStructurePath);
		window.localStorage.removeItem('atlasStructureToLoad');
        if (atlasStructurePath) {
            loadingManager.loadAtlasStructure(atlasStructurePath);
        }
        else {
            throw 'Atlas structure path is not defined in global parameters';
        }

        setupGUI();
        setupInset();

        mainApp.on('loadingManager.atlasStructureLoaded', finishSceneSetup);
    }

    function setupGUI () {
        gui = new dat.GUI({autoPlace : false});
        var guiContainer = document.getElementById('gui-container');
        guiContainer.appendChild(gui.domElement);

        gui.addColor( objectSelector, 'highlightMeshColor').name('Selection Color');
        mainApp.gui = gui;

        var lightKitGui = gui.addFolder('LightKit');

        lightKitGui.add(lightKit, 'intensity',0,0.02)
            .name('Light Intensity')
            .onChange(function () {lightKit.updateIntensity();});
        var menu = lightKitGui.addFolder('Warmth');
        var id;
        for (id in lightKit.lights) {
            menu.add(lightKit.warmth, id, 0,1)
                .name(id+' warmth')
                .onChange(function(){lightKit.updateColor();});
        }
        menu = lightKitGui.addFolder('Intensity Ratio');
        for (id in lightKit.lights) {
            menu.add(lightKit.ratio, id, 1,10)
                .name(id+' intensity ratio')
                .onChange(function(){lightKit.updateIntensity();});
        }
        menu = lightKitGui.addFolder('Longitude');
        for (id in lightKit.lights) {
            menu.add(lightKit.longitude, id, -180, 180)
                .name(id+' longitude')
                .onChange(function(){lightKit.updatePosition();});
        }
        menu = lightKitGui.addFolder('Latitude');
        for (id in lightKit.lights) {
            menu.add(lightKit.latitude, id, -90,90)
                .name(id+' latitude')
                .onChange(function(){lightKit.updatePosition();});
        }

        var materialController = new THREE.MeshPhongMaterial({});

        function updateMaterials (key) {
            meshesList.forEach(function (m) {
                m.material[key] = materialController[key];
            });
        }
        menu = gui.addFolder('Material');
        menu.addColor(materialController, 'specular')
            .name('Specular')
            .onChange(function () {updateMaterials('specular');});
        menu.add(materialController, 'shininess',0,100)
            .name('Shininess')
            .onChange(function () {updateMaterials('shininess');});

        gui.close();
    }

    function onWindowResize() {

        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();

        renderer.setSize( container.clientWidth, container.clientHeight );

        controls.handleResize();

        containerOffset = $(container).offset();
    }

    function animate(time) {

        requestAnimationFrame( animate );

        controls.update();
        lightKit.updatePosition();

        //copy position of the camera into inset
        camera2.position.copy( camera.position );
        camera2.position.sub( controls.target );
        camera2.position.setLength( 300 );
        camera2.lookAt( scene2.position );

        renderer.render( scene, camera );
        renderer2.render( scene2, camera2);

        stats.update();
        displayPickup();
        TWEEN.update(time);
    }

    function displayPickup() {
        if (needPickupUpdate) {

            raycaster.setFromCamera( mouse, camera );

            var intersects = raycaster.intersectObjects( meshesAndSlicesList );

            var object = null;
            var point;
            if (intersects.length > 0) {
                object = intersects[0].object;
                point = intersects[0].point;
                //pick up in the 3D slices
                if (object.geometry instanceof THREE.PlaneGeometry) {
                    var structures = volumesManager.getStructuresAtRASPosition(point);
                    if (structures[0]) {
                        object = structures[0].mesh;
                    }
                    else {
                        object = null;
                    }
                }
            }
            mainApp.emit('mouseOverScene', {object:object, point :point});
            // console.log(point);
            mainApp.emit('mouseOverObject', object);
            needPickupUpdate = false;
        }
    }

    function onSceneLeaveWindow(event) {     
            mainApp.emit('mouseOverObject', null);
    }

    function onSceneMouseMove(event) {

        //check if we are not doing a drag (trackball controls)
        if (event.buttons === 0) {
            //compute offset due to container position
            mouse.x = ( (event.clientX-containerOffset.left) / container.clientWidth ) * 2 - 1;
            mouse.y = - ( (event.clientY-containerOffset.top) / container.clientHeight ) * 2 + 1;

            needPickupUpdate = true;
        }
        else {
            needPickupUpdate = false;
        }
    }

    function onSceneMouseDown (event) {
        mousedownPosition.x = ( (event.clientX-containerOffset.left) / container.clientWidth ) * 2 - 1;
        mousedownPosition.y = - ( (event.clientY-containerOffset.top) / container.clientHeight ) * 2 + 1;
        mousedownDate = Date.now();
        needPickupUpdate = false;
    }

    function onSceneMouseUp (event) {
        var time = Date.now();
        var position = new THREE.Vector2(0,0);
        position.x = ( (event.clientX-containerOffset.left) / container.clientWidth ) * 2 - 1;
        position.y = - ( (event.clientY-containerOffset.top) / container.clientHeight ) * 2 + 1;

        if (time - mousedownDate < 300 && mousedownPosition.distanceTo(position) < 5) {
            raycaster.setFromCamera( position, camera );
            var intersects = raycaster.intersectObjects( meshesList );
            var firstIntersect = intersects.length > 0 ? intersects[0] : null;
            var intersectedAtlasStructure = firstIntersect ? firstIntersect.object.atlasStructure : null;

            if(event.ctrlKey) {
                if(firstIntersect) {
                    if(intersectedAtlasStructure.selected) {
                        objectSelector.removeFromSelection(intersectedAtlasStructure);
                    }
                    else {
                        objectSelector.addToSelection(firstIntersect.object.atlasStructure);
                    }
                }
            }
            else if (event.altKey && volumesManager.compositingSlices.axial) {
                if(firstIntersect) {
                    var point = firstIntersect.point;
                    var offset = volumesManager.volumes[0].RASDimensions;
                    volumesManager.compositingSlices.sagittal.index = Math.floor(point.x + offset[0]/2);
                    volumesManager.compositingSlices.sagittal.repaint(true);
                    volumesManager.compositingSlices.coronal.index = Math.floor(point.y + offset[1]/2);
                    volumesManager.compositingSlices.coronal.repaint(true);
                    volumesManager.compositingSlices.axial.index = Math.floor(point.z + offset[2]/2);
                    volumesManager.compositingSlices.axial.repaint(true);
                }
            }
            else {
                if(firstIntersect) {
                    objectSelector.select(intersectedAtlasStructure);
                }
                else {
                    objectSelector.clearSelection();
                }
            }
        }
    }

    function setupInset() {
        var insetWidth = 150,
            insetHeight = 150,
            axisLength = 100;
        container2 = document.getElementById('inset');
        container2.width = insetWidth;
        container2.height = insetHeight;

        // renderer
        renderer2 = new THREE.WebGLRenderer({alpha : true});
        renderer2.setClearColor( 0x000000, 0 );
        renderer2.setSize( insetWidth, insetHeight );
        container2.appendChild( renderer2.domElement );

        // scene
        scene2 = new THREE.Scene();

        // camera
        camera2 = new THREE.PerspectiveCamera( 50, insetWidth / insetHeight, 1, 1000 );
        camera2.up = camera.up; // important!

        // axes
        axes2 = new THREE.AxisHelper( axisLength );
        scene2.add( axes2 );

        //create sprites
        var spriteA = createTextSprite('A');
        spriteA.position.set(0, axisLength, 0);
        scene2.add(spriteA);
        var spriteP = createTextSprite('P');
        spriteP.position.set(0, -axisLength, 0);
        scene2.add(spriteP);
        var spriteL = createTextSprite('L');
        spriteL.position.set(-axisLength, 0, 0);
        scene2.add(spriteL);
        var spriteR = createTextSprite('R');
        spriteR.position.set(axisLength, 0, 0);
        scene2.add(spriteR);
        var spriteI = createTextSprite('I');
        spriteI.position.set(0, 0, -axisLength);
        scene2.add(spriteI);
        var spriteS = createTextSprite('S');
        spriteS.position.set(0, 0, axisLength);
        scene2.add(spriteS);
    }

    function createTextSprite (message) {

        var fontface = "Arial";

        var fontsize = 30;

        var canvas = document.createElement('canvas');
        canvas.width = fontsize + 10;
        canvas.height = fontsize + 10;
        var context = canvas.getContext('2d');
        context.font = "Bold " + fontsize + "px " + fontface;


        // text color
        context.fillStyle = "rgba(0, 0, 0, 1.0)";
        context.textAlign = 'center';

        context.fillText( message, fontsize/2+5, fontsize+5);

        // canvas contents will be used for a texture
        var texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;

        var spriteMaterial = new THREE.SpriteMaterial({ map: texture});

        var sprite = new THREE.Sprite( spriteMaterial );
        sprite.scale.set(fontsize,fontsize,1.0);
        return sprite;
    }

    function tweenCamera (position, target, up) {
        var cameraStart = camera.position.clone().sub(controls.target),
            cameraStartLength = cameraStart.length(),
            cameraEnd = new THREE.Vector3().add(position).sub(target),
            cameraEndLength = cameraEnd.length(),
            tweenDuration = window.globalViewerParameters.cameraTweenDuration || 1000,
            upTweenFinished = false,
            targetTweenFinished = false,
            resolvePromise;


        new TWEEN.Tween(controls.target)
            .to(target, tweenDuration)
            .onUpdate(function (timestamp) {
            var l = (1-timestamp)*cameraStartLength+timestamp*cameraEndLength;
            var t = cameraStart.clone().lerp(cameraEnd, timestamp).setLength(l);
            camera.position.copy(t.add(controls.target));
        }).onComplete(function () {
            controls.target.copy(target);
            camera.position.copy(position);
            targetTweenFinished = true;
            if (upTweenFinished) {
                resolvePromise();
            }

        }).start();

        new TWEEN.Tween(camera.up)
            .to(up, tweenDuration)
            .onUpdate(function () {
            camera.up.normalize();
        }).onComplete(function () {
            camera.up.copy(up);
            upTweenFinished = true;
            if (targetTweenFinished) {
                resolvePromise();
            }
        }).start();

        var promise = new Promise(function (resolve) {
            resolvePromise = resolve;
        });

        return promise;
    }

    function initFirebase () {

        //init camera binding
        function cameraWatchCallback (obj) {
            obj.position = camera.position;
            obj.target = controls.target;
            obj.up = camera.up;
        }
        function cameraDbChangeCallback (val) {
            if (val && val.position) {
                tweenCamera(val.position, val.target, val.up);
            }
        }
        //using custom bind because of the tween, we don't want the camera position to be changed immediatly
        firebaseView.customBind(cameraWatchCallback, cameraDbChangeCallback, ['camera']);


        //init camera near and far binding
        function cameraPlanesWatchCallback (obj) {
            obj.near = camera.near;
            obj.far = camera.far;
        }
        function cameraPlaneDbChangeCallback (val) {
            if (val && val.far) {
                setCameraPlanes(val.near, val.far);
            }
        }
        //using custom bind because of the tween, we don't want the camera position to be changed immediatly
        firebaseView.customBind(cameraPlanesWatchCallback, cameraPlaneDbChangeCallback, ['cameraPlanes']);
    }

    function getSceneBoundingBox () {
        var min = new THREE.Vector3(Infinity, Infinity, Infinity),
            max = new THREE.Vector3(-Infinity, -Infinity, -Infinity),
            i,
            mesh,
            bb;

        for (i = 0; i < meshesAndSlicesList.length; i++) {
            mesh = meshesAndSlicesList[i];
            mesh.geometry.computeBoundingBox();
            bb = mesh.geometry.boundingBox.clone();
            min.min(bb.min);
            max.max(bb.max);
        }
        return {min : min, max : max};
    }

    function autocenterCamera (commitAfter) {
        commitAfter = commitAfter || true;
        var bb = getSceneBoundingBox();
        var center = (new THREE.Vector3()).lerpVectors(bb.min, bb.max, 0.5);

        var height = 1.2*(Math.max(bb.max.y-center.y, bb.max.x - center.x)) / 
                         (Math.tan(camera.fov * Math.PI / 360));

        var initialPosition = window.globalViewerParameters.cameraInitialPositionVector || [0,0,1];
        var cameraPosition = new THREE.Vector3(center.x + height*initialPosition[0], 
                            center.y + height*initialPosition[1], 
                            center.z + height*initialPosition[2]);

        var initialUp = window.globalViewerParameters.cameraInitialUpVector || [0,1,0];
        var up = new THREE.Vector3(initialUp[0], initialUp[1], initialUp[2]);

        up.normalize();

        lightKit.distanceToTarget = height*15; // simulate infinity

        setCameraPlanes(camera.near, 15*height);
        tweenCamera(cameraPosition, center, up).then(function () {
            if (commitAfter) {
                firebaseView.commit('camera');
                firebaseView.commit('cameraPlanes');
            }
        });
    }

    function setCameraPlanes (near, far) {
        camera.near = near;
        camera.far = far;
        camera.updateProjectionMatrix();
    }

    mainApp.on('mainToolbar.autocenterCamera', autocenterCamera);
    mainApp.on('loadingManager.loadingEnd', function () {
        setTimeout(function () {
            autocenterCamera(false);
        }, 100);
    });

    init();

}]);
