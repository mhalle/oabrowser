if (!Detector.webgl) {
    Detector.addGetWebGLMessage();
}

angular.module('atlasViewer').run(function (mainApp) {

    var container,
        stats,
        camera,
        controls,
        scene,
        renderer,
        atlasStructure,
        loader,
        loadedFile,
        numberOfFilesToLoad,
        vtkStructures,
        mouse,
        raycaster,
        meshesList = [],
        pickupTimeout = setTimeout(function () {}, 0),
        resizeTimeout = setTimeout(function () {}, 0),
        gui,
        container2,
        renderer2,
        camera2,
        axes2,
        scene2,
        nrrdLoader,
        header;


    //this function enables us to create a scope and then keep the right item in the callback
    function loadVTKFile(i) {
        var file = vtkStructures[i].sourceSelector.dataSourceObject.source;
        loader.load(file, function (geometry) {

            var item = vtkStructures[i];

            geometry.computeVertexNormals();

            var rgb = item.renderOptions.color.match(/^rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,?\s*([.0-9]+)?\)$/);
            if (rgb) {
                rgb = rgb.map(Number);
            }
            else {
                rgb = [0, 0, 0, 0];
            }

            var material = new THREE.MeshLambertMaterial({
                wireframe : false,
                morphTargets : false,
                side : THREE.DoubleSide,
                color : rgb[1] * 256 * 256 + rgb[2] * 256 + rgb[3]
            });

            material.opacity = item.renderOptions.opacity || rgb[4] || 1.0;
            material.visible = true;


            if (material.opacity < 1) {
                material.transparent = true;
            }


            var mesh = new THREE.Mesh(geometry, material);
            //TODO : retrieve name from annotation object if annotation use a reference
            mesh.name = item.annotation && item.annotation.name || '';
            meshesList.push(mesh);
            item.mesh = mesh;
            scene.add(mesh);
            loadedFile++;

            //signal to the modal
            mainApp.emit('modal.fileLoaded');

            if (loadedFile === numberOfFilesToLoad) {
                //put it in an immediate timeout to give the browser the opportunity to refresh the modal
                setTimeout(createHierarchy, 0);
            }

        });
    }

    function getTreeObjectFromUuid(uuid) {
        var item = atlasStructure.find(x=>x['@id']===uuid);
        var treeObject = {
            name : item.annotation.name,
            mesh : item.mesh
        };
        if (item['@type']==='group') {
            treeObject.children = item.members.map(getTreeObjectFromUuid).filter(x => x.mesh !== undefined);
            treeObject.mesh = new HierarchyGroup();
            treeObject.mesh.name = treeObject.name;
            for (var i = 0; i< treeObject.children.length; i++) {
                try {
                    treeObject.mesh.add(treeObject.children[i].mesh);
                }
                catch (e) {
                    console.log(e);
                }
            }
        }
        return treeObject;
    }

    function createHierarchy() {
        var rootGroups = atlasStructure.filter(x => x['@type']==='group' && header.roots.indexOf(x['@id']) !== -1);
        var hierarchyTree = {
            children : rootGroups.map(group => getTreeObjectFromUuid(group['@id']))
        };

        mainApp.emit('insertTree',hierarchyTree);

        //send a signal to the modal
        mainApp.emit('modal.hierarchyLoaded', vtkStructures.length);


    }

    function dealWithAtlasStructure(data) {
        var i;
        atlasStructure = data;

        header = atlasStructure.find(x=>x['@type']==='header');
        if (header) {
            mainApp.emit('headerData',header);
        }

        var vtkDatasources = data.filter(function (object) { 
            return object['@type']==='datasource' && /\.vtk$/.test(object.source);
        });
        var vtkDatasourcesId = vtkDatasources.map(source => source["@id"]);
        vtkStructures = [];
        for(i=0; i<atlasStructure.length; i++) {
            var item = atlasStructure[i];
            if (item['@type']==='structure') {
                var dataSourceIndex = vtkDatasourcesId.indexOf(item.sourceSelector.dataSource);
                if ( dataSourceIndex> -1) {
                    //item refers to a vtk file
                    item.sourceSelector.dataSourceObject = vtkDatasources[dataSourceIndex];
                    vtkStructures.push(item);
                }
            }
        }


        //Load all the vtk files
        loader = new THREE.VTKLoader();
        loadedFile = 0;
        numberOfFilesToLoad = vtkStructures.length;

        //send the modal a signal to give the number of vtk files to load
        mainApp.emit('modal.JSONLoaded', numberOfFilesToLoad);


        for (i = 0; i<vtkStructures.length; i++) {
            loadVTKFile(i);
        }

        //load background
        nrrdLoader = new THREE.NRRDLoader();
        if (typeof header.backgroundImages === "string") {
            loadBackground(header.backgroundImages);
        }
        else if (typeof header.backgroundImages === "object") {
            for (i = 0; i < header.backgroundImages.length; i++) {
                loadBackground(header.backgroundImages[i]);
            }
        }

        // renderer

        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();

        renderer = new THREE.WebGLRenderer( { antialias: false } );
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( container.clientWidth, container.clientHeight );

        container.appendChild( renderer.domElement );

        stats = new Stats();
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.top = '0px';
        container.appendChild( stats.domElement );

        //

        window.addEventListener( 'resize', onWindowResize, false );
        mainApp.on('ui.layout.resize', function () {
            clearInterval(resizeTimeout);
            console.log('set resize timeout');
            resizeTimeout = setTimeout(onWindowResize, 500);
        });

        container.addEventListener('mousemove', onSceneMouseMove, false);

        animate();

    }

    function init() {

        container = document.getElementById('rendererFrame');

        camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.01, 1e10 );
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

        scene.add( camera );

        mouse = new THREE.Vector2();
        raycaster = new THREE.Raycaster();

        // light

        var dirLight = new THREE.DirectionalLight( 0xffffff );
        dirLight.position.set( 200, 200, 1000 ).normalize();

        camera.add( dirLight );
        camera.add( dirLight.target );

        //fetch atlas structure
        jQuery.ajax({
            dataType: "json",
            url: window.globalViewerParameters.atlasStructurePath,
            async: true,
            success: dealWithAtlasStructure
        });

        gui = new dat.GUI({autoPlace : false});
        var guiContainer = document.getElementById('gui-container');
        guiContainer.appendChild(gui.domElement);

        setupInset();


    }

    function onWindowResize() {

        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();

        renderer.setSize( container.clientWidth, container.clientHeight );

        controls.handleResize();

    }

    function animate() {

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

    }

    function getAllTheHierarchyPaths(object) {
        var result = [];
        function addParents (object, path) {
            if (object.hierarchyParents.length === 0) {
                result.push(object.name+path);
                return path;
            }
            for (var i = 0; i < object.hierarchyParents.length; i++) {
                var parent = object.hierarchyParents[i];
                addParents(parent, '//'+object.name+path);
            }
        }
        addParents(object, '');
        return result.map(s => s.split('//'));
    }

    function displayPickup() {

        raycaster.setFromCamera( mouse, camera );

        var intersects = raycaster.intersectObjects( meshesList );

        var paths = [[]];
        if (intersects.length > 0) {
            paths = getAllTheHierarchyPaths(intersects[0].object);
        }
        mainApp.emit('insertBreadcrumbs', paths);

    }

    function onSceneMouseMove(event) {

        mouse.x = ( event.clientX / container.clientWidth ) * 2 - 1;
        mouse.y = - ( event.clientY / container.clientHeight ) * 2 + 1;

        clearTimeout(pickupTimeout);
        pickupTimeout = setTimeout(displayPickup, mainApp.globalParameters.timeoutDelayPickup);


    }

    function setupInset() {
        var insetWidth = 150,
            insetHeight = 150;
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
        axes2 = new THREE.AxisHelper( 100 );
        scene2.add( axes2 );
    }

    function loadBackground(nrrdFileLocation) {

        nrrdLoader.load( nrrdFileLocation, function ( volume ) {
            var sliceZ,
                sliceY,
                sliceX;
            var time = Date.now();

            if (window.globalViewerParameters.cubeHelper) {
                //box helper to see the extend of the volume
                var geometry = new THREE.BoxGeometry( volume.xLength, volume.yLength, volume.zLength );
                var material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
                var cube = new THREE.Mesh( geometry, material );
                cube.visible = false;
                var box = new THREE.BoxHelper( cube );
                scene.add( box );
                box.applyMatrix(volume.matrix);
                scene.add( cube );
            }

            //z plane

            sliceZ = volume.extractSlice('z',Math.floor(volume.RASDimensions[2]/2));
            console.debug(sliceZ);
            mainApp.emit('insertSlice', {sliceId : 'axial', slice : sliceZ});
            scene.add( sliceZ.mesh );

            //y plane
            sliceY = volume.extractSlice('y',Math.floor(volume.RASDimensions[1]/2));
            console.debug(sliceY);
            mainApp.emit('insertSlice', {sliceId : 'corronal', slice : sliceY});
            scene.add( sliceY.mesh );

            //x plane
            sliceX = volume.extractSlice('x',Math.floor(volume.RASDimensions[0]/2));
            console.debug(sliceX);
            mainApp.emit('insertSlice', {sliceId : 'sagittal', slice : sliceX});
            scene.add( sliceX.mesh );

            console.log('generating slices in ' +(Date.now()-time)+ ' ms');

            gui.add( sliceX, "index", 0, volume.RASDimensions[0], 1 ).name( "indexX" ).onChange( function () {sliceX.repaint.call(sliceX);} );
            gui.add( sliceY, "index", 0, volume.RASDimensions[1], 1 ).name( "indexY" ).onChange( function () {sliceY.repaint.call(sliceY);} );
            gui.add( sliceZ, "index", 0, volume.RASDimensions[2], 1 ).name( "indexZ" ).onChange( function () {sliceZ.repaint.call(sliceZ);} );

            gui.add( volume, "lowerThreshold", volume.min, volume.max, 1).name( "Lower Threshold").onChange( function () {
                volume.repaintAllSlices();
            });
            gui.add( volume, "upperThreshold", volume.min, volume.max, 1).name( "Upper Threshold").onChange( function () {
                volume.repaintAllSlices();
            });
            gui.add( volume, "windowLow", volume.min, volume.max, 1).name( "Window Low").onChange( function () {
                volume.repaintAllSlices();
            });
            gui.add( volume, "windowHigh", volume.min, volume.max, 1).name( "Window High").onChange( function () {
                volume.repaintAllSlices();
            });

        } );

    }

    init();

});
