if (!Detector.webgl) {
    Detector.addGetWebGLMessage();
}

angular.module('atlasDemo').run(["mainApp", "objectSelector", "atlasJson", "volumesManager", "firebaseView", "loadingManager", function (mainApp, objectSelector, atlasJson, volumesManager, firebaseView, loadingManager) {

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
        //firebase binding for selection, visibility and visibility in tree
        firebaseView.bind(item, ['selected', 'visibleInTree'],'models.'+item['@id']);

        //do not bind 'visible' property with group because they will fetch their property from their child
        if (item['@type'] !== 'group') {
            firebaseView.bind(item.mesh, ['visible'],'models.'+item['@id']+'.mesh');
        }
    }

    function getMesh(item) {

        if (item['@type']==='group') {
            var childrenMeshes = item.members.map(getMesh);
            //HierarchyGroup is used instead of THREE.Group because THREE.Group does not allow children to have multiple parents
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
        var rootGroups = header.roots;
        rootGroups.map(getMesh);

        mainApp.emit('insertTree',rootGroups);

        //send a signal to the modal
        mainApp.emit('modal.hierarchyLoaded');


    }

    function finishSceneSetup() {
        // renderer

        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();

        renderer = new THREE.WebGLRenderer( { antialias: false, alpha : true } );
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
        mainApp.on('ui.layout.resize', setResizeTimeout);


        //register events for the pickup and selection
        container.addEventListener('mousemove', onSceneMouseMove, false);
        container.addEventListener('mousedown', onSceneMouseDown);
        container.addEventListener('mouseup', onSceneMouseUp);

        //init offset
        containerOffset = $(container).offset();

        //start animating the 3D view
        animate();

        //start the binding of the camera
        initFirebase();

    }

    function init() {

        container = document.getElementById('rendererFrame');

        camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.05, 1e8 );
        camera.position.z = 300;

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

        lightKit = new LightKit(camera, controls);


        //fetch atlas structure
        if (window.globalViewerParameters && window.globalViewerParameters.atlasStructurePath) {
        loadingManager.loadAtlasStructure(window.globalViewerParameters.atlasStructurePath);
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

        lightKitGui.add(lightKit, 'intensity',0,0.02).name('Light Intensity').onChange(function () {lightKit.updateIntensity();});
        var menu = lightKitGui.addFolder('Warmth');
        var id;
        for (id in lightKit.lights) {
            menu.add(lightKit.warmth, id, 0,1).name(id+' warmth').onChange(function(){lightKit.updateColor();});
        }
        menu = lightKitGui.addFolder('Intensity Ratio');
        for (id in lightKit.lights) {
            menu.add(lightKit.ratio, id, 1,10).name(id+' intensity ratio').onChange(function(){lightKit.updateIntensity();});
        }
        menu = lightKitGui.addFolder('Longitude');
        for (id in lightKit.lights) {
            menu.add(lightKit.longitude, id, -180,180).name(id+' longitude').onChange(function(){lightKit.updatePosition();});
        }
        menu = lightKitGui.addFolder('Latitude');
        for (id in lightKit.lights) {
            menu.add(lightKit.longitude, id, -90,90).name(id+' latitude').onChange(function(){lightKit.updatePosition();});
        }

        var materialController = new THREE.MeshPhongMaterial({});

        function updateMaterials (key) {
            meshesList.forEach(function (m) {
                m.material[key] = materialController[key];
            });
        }
        menu = gui.addFolder('Material');
        menu.addColor(materialController, 'specular').name('Specular').onChange(function () {updateMaterials('specular');});
        menu.add(materialController, 'shininess',0,100).name('Shininess').onChange(function () {updateMaterials('shininess');});

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
            if (intersects.length > 0) {
                object = intersects[0].object;
                //pick up in the 3D slices
                if (object.geometry instanceof THREE.PlaneGeometry) {
                    var point = intersects[0].point;
                    var structures = volumesManager.getStructuresAtRASPosition(point);
                    if (structures[0]) {
                        object = structures[0].mesh;
                    }
                    else {
                        object = null;
                    }
                }
            }
            mainApp.emit('mouseOverObject', object);
            needPickupUpdate = false;
        }

    }

    function onSceneMouseMove(event) {

        //check if we are not doing a drag (trackball controls)
        if (event.buttons === 0) {
            //compute offset due to container position
            mouse.x = ( (event.clientX-containerOffset.left) / container.clientWidth ) * 2 - 1;
            mouse.y = - ( (event.clientY-containerOffset.top) / container.clientHeight ) * 2 + 1;

            needPickupUpdate = true;
        }


    }

    function onSceneMouseDown (event) {

        mousedownPosition.x = ( (event.clientX-containerOffset.left) / container.clientWidth ) * 2 - 1;
        mousedownPosition.y = - ( (event.clientY-containerOffset.top) / container.clientHeight ) * 2 + 1;
        mousedownDate = Date.now();

    }

    function onSceneMouseUp (event) {
        var time = Date.now();
        var position = new THREE.Vector2(0,0);
        position.x = ( (event.clientX-containerOffset.left) / container.clientWidth ) * 2 - 1;
        position.y = - ( (event.clientY-containerOffset.top) / container.clientHeight ) * 2 + 1;

        if (time - mousedownDate < 300 && mousedownPosition.distanceTo(position)<5) {

            raycaster.setFromCamera( position, camera );

            var intersects = raycaster.intersectObjects( meshesList );

            var object = null;
            if (intersects.length > 0) {
                object = intersects[0].object;
                if (event.ctrlKey) {
                    if (object.selected) {
                        objectSelector.removeFromSelection(object.atlasStructure);
                    }
                    else {
                        objectSelector.addToSelection(object.atlasStructure);
                    }
                }
                else if (event.altKey && volumesManager.compositingSlices.axial) {
                    var point = intersects[0].point;
                    var offset = volumesManager.volumes[0].RASDimensions;
                    volumesManager.compositingSlices.sagittal.index = Math.floor(point.x + offset[0]/2);
                    volumesManager.compositingSlices.sagittal.repaint(true);
                    volumesManager.compositingSlices.coronal.index = Math.floor(point.y + offset[1]/2);
                    volumesManager.compositingSlices.coronal.repaint(true);
                    volumesManager.compositingSlices.axial.index = Math.floor(point.z + offset[2]/2);
                    volumesManager.compositingSlices.axial.repaint(true);
                }
                else {
                    if (object.selected) {
                        objectSelector.clearSelection();
                    }
                    else {
                        objectSelector.select(object);
                    }
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

    function initFirebase () {

        function watchCallback (obj) {
            obj.position = camera.position;
            obj.target = controls.target;
            obj.up = camera.up;
        }
        function dbChangeCallback (val) {
            if (val && val.position) {
                var cameraStart = camera.position.clone().sub(controls.target),
                    cameraStartLength = cameraStart.length(),
                    cameraEnd = new THREE.Vector3().add(val.position).sub(val.target),
                    cameraEndLength = cameraEnd.length();


                new TWEEN.Tween(controls.target)
                    .to(val.target, 1000)
                    .onUpdate(function (timestamp) {
                    var l = (1-timestamp)*cameraStartLength+timestamp*cameraEndLength;
                    var t = cameraStart.clone().lerp(cameraEnd, timestamp).setLength(l);
                    camera.position.copy(t.add(controls.target));
                }).onComplete(function () {
                    controls.target.copy(val.target);
                    camera.position.copy(val.position);
                }).start();

                new TWEEN.Tween(camera.up)
                    .to(val.up, 1000)
                    .onUpdate(function () {
                    camera.up.normalize();
                }).onComplete(function () {
                    camera.up.copy(val.up);
                }).start();
            }
        }
        firebaseView.customBind(watchCallback, dbChangeCallback, ['camera']);
    }


    init();

}]);
