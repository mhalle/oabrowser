angular.module('atlasDemo').provider('loadingManager', ['mainAppProvider', 'volumesManagerProvider', 'atlasJsonProvider', function (mainAppProvider, volumesManagerProvider, atlasJsonProvider) {

    var mainApp = mainAppProvider.$get(),
        atlasJson = atlasJsonProvider.$get(),
        volumesManager = volumesManagerProvider.$get(),
        nrrdLoader = new THREE.NRRDLoader(),
        vtkLoader = new THREE.VTKLoader(),
        stlLoader = new THREE.STLLoader(),
        singleton = {
            numberOfModelsLoaded : 0,
            numberOfVolumesLoaded : 0
        },
        volumesLoaded = {},
        volumesProgress = {},
        modelsLoaded = {},
        atlasStructurePath;

    function getUrl(url) {
        var theUrl = new URI(url);
        if (theUrl.is("relative")) {
            theUrl = theUrl.absoluteTo(atlasStructurePath);
        }
        return theUrl.toString();
    }

    function loadVolume(datasource, treatAsBackground) {

        var nrrdFileLocation;
        if (datasource.baseURL) {
            nrrdFileLocation = getUrl(datasource.baseURL.url + datasource.source);
        }
        else {
            nrrdFileLocation = getUrl(datasource.source);
        }

        var onProgress = function ( xhr ) {
            if ( xhr.lengthComputable ) {
                var percentComplete = Math.round(xhr.loaded / xhr.total * 100);
                volumesProgress[nrrdFileLocation] = percentComplete;
                mainApp.emit('loadingManager.volumeProgress', {datasource : datasource, progress : percentComplete});
            }
        };

        var onSuccess = function (volume) {
            volumesLoaded[nrrdFileLocation] = true;
            singleton.numberOfVolumesLoaded++;

            volumesManager.addVolume(volume, datasource, treatAsBackground);

            mainApp.emit('loadingManager.volumeLoaded', datasource);
            if (singleton.totalNumberOfVolumes === singleton.numberOfVolumesLoaded) {
                mainApp.emit('loadingManager.everyVolumeLoaded');
                testIfLoadingIsFinished();
            }
        };

        mainApp.emit('loadingManager.volumeStart', datasource);

        nrrdLoader.load( nrrdFileLocation, onSuccess, onProgress );

    }

    function onNewMesh (structure, mesh, fileName) {
        mesh.name = structure.annotation && structure.annotation.name || '';
        mesh.renderOrder = 1;
        structure.mesh = mesh;
        mesh.atlasStructure = structure;

        modelsLoaded[fileName] = true;
        singleton.numberOfModelsLoaded++;

        //signal to the modal
        mainApp.emit('loadingManager.modelLoaded', fileName);

        mainApp.emit('loadingManager.newMesh', mesh);

        if (singleton.numberOfModelsLoaded === singleton.totalNumberOfModels) {
            mainApp.emit('loadingManager.everyModelLoaded');
            testIfLoadingIsFinished();
        }
    }

    function loadVTKModel(structure) {
        var file;
        if (Array.isArray(structure.sourceSelector)) {
            var geometrySelector = structure.sourceSelector.find(selector => selector['@type'].includes('GeometrySelector'));
            if (geometrySelector) {

                //prepend base url if it exists
                if (geometrySelector.dataSource.baseURL) {
                    file = getUrl(geometrySelector.dataSource.baseURL.url + geometrySelector.dataSource.source);
                }
                else {
                    file = getUrl(geometrySelector.dataSource.source);
                }
            }
            else {
                throw 'In case of multiple selectors, VTK selector should have an array as @type which includes "GeometrySelector"';
            }
        }
        else {

            //prepend base url if it exists
            if (structure.sourceSelector.dataSource.baseURL) {
                file = getUrl(structure.sourceSelector.dataSource.baseURL.url + structure.sourceSelector.dataSource.source);
            }
            else {
                file = getUrl(structure.sourceSelector.dataSource.source);
            }
        }

        vtkLoader.load(file, function (geometry) {

            var item = structure;

            geometry.computeVertexNormals();

            var material = new THREE.MeshPhongMaterial({
                wireframe : false,
                morphTargets : false,
                side : THREE.DoubleSide,
                color : item.renderOption.color >> 8 //get rid of alpha
            });

            material.opacity = (item.renderOption.color & 0xff)/255;
            material.visible = true;


            if (material.opacity < 1) {
                material.transparent = true;
            }


            var mesh = new THREE.Mesh(geometry, material);

            onNewMesh(item, mesh, file);

        });
    }
    function loadSTLModel(structure) {
        var file;
        if (Array.isArray(structure.sourceSelector)) {
            var geometrySelector = structure.sourceSelector.find(selector => selector['@type'].includes('GeometrySelector'));
            if (geometrySelector) {

                //prepend base url if it exists
                if (geometrySelector.dataSource.baseURL) {
                    file = getUrl(geometrySelector.dataSource.baseURL.url + geometrySelector.dataSource.source);
                }
                else {
                    file = getUrl(geometrySelector.dataSource.source);
                }
            }
            else {
                throw 'In case of multiple selectors, STL selector should have an array as @type which includes "GeometrySelector"';
            }
        }
        else {

            //prepend base url if it exists
            if (structure.sourceSelector.dataSource.baseURL) {
                file = getUrl(structure.sourceSelector.dataSource.baseURL.url + structure.sourceSelector.dataSource.source);
            }
            else {
                file = getUrl(structure.sourceSelector.dataSource.source);
            }
        }

        stlLoader.load(file, function (geometry) {

            var item = structure;

            geometry.computeVertexNormals();

            var material = new THREE.MeshPhongMaterial({
                wireframe : false,
                morphTargets : false,
                side : THREE.DoubleSide,
                color : item.renderOption.color >> 8 //get rid of alpha
            });

            material.opacity = (item.renderOption.color & 0xff)/255;
            material.visible = true;


            if (material.opacity < 1) {
                material.transparent = true;
            }


            var mesh = new THREE.Mesh(geometry, material);

            onNewMesh(item, mesh, file);

        });
    }

    function loadOBJModel(structure) {
        var objFile,
            objDirectory,
            mtlFile,
            mtlDirectory,
            mtlLoader = new THREE.MTLLoader();

        if (Array.isArray(structure.sourceSelector)) {
            var geometrySelector = structure.sourceSelector.find(selector => selector['@type'].includes('GeometrySelector'));
            if (geometrySelector) {

                //prepend base url if it exists
                if ( geometrySelector.dataSource.baseURL) {
                    objFile =  getUrl(geometrySelector.dataSource.baseURL.url + geometrySelector.dataSource.source);
                }
                else {
                    objFile = getUrl(geometrySelector.dataSource.source);
                }
            }
            else {
                throw 'In case of multiple selectors, VTK selector should have an array as @type which includes "GeometrySelector"';
            }
        }
        else {

            //prepend base url if it exists
            if ( structure.sourceSelector.dataSource.baseURL) {
                objFile =  getUrl(structure.sourceSelector.dataSource.baseURL.url + structure.sourceSelector.dataSource.source);
            }
            else {
                objFile = getUrl(structure.sourceSelector.dataSource.source);
            }
        }
        //split the path into a directory and a filename to be able to load dependant file in the same directory (textures)
        objDirectory = objFile.split('/');
        objFile = objDirectory.pop();
        objDirectory = objDirectory.join('/')+'/';


        //split the path into a directory and a filename to be able to load dependant file in the same directory (textures)
        mtlFile = structure.renderOption.material.source;
        //prepend base url if it exists
        if ( structure.renderOption.material.source.baseURL) {
            mtlFile =  structure.renderOption.material.source.baseURL.url + mtlFile;
        }
        mtlDirectory = mtlFile.split('/');
        mtlFile = mtlDirectory.pop();
        mtlDirectory = mtlDirectory.join('/')+'/';

        mtlLoader.setBaseUrl( mtlDirectory );
        mtlLoader.setPath( mtlDirectory );

        mtlLoader.load( mtlFile, function( materials ) {

            materials.preload();

            var objLoader = new THREE.OBJLoader();
            objLoader.setMaterials( materials );
            objLoader.setPath( objDirectory );
            objLoader.load( objFile, function ( object ) {

                object.traverse(function (child) {

                    if (child instanceof THREE.Mesh) {
                        // onNewMesh will remove the mesh from its current group to put directly in the scene
                        // we need to use a timeout for object.traverse to finish correctly
                        // or else child gets removed, children length changes and for instruction fails
                        setTimeout(function () {
                            onNewMesh(structure, child, objFile);
                        },0);
                    }
                });


            }, function () {}, function () {} );

        });


    }

    function dealWithAtlasStructure(data) {
        var i,
            atlasStructure = atlasJson.parse(data);

        mainApp.atlasStructure = atlasStructure;

        var header = atlasStructure.Header;
        if (header) {
            mainApp.emit('headerData',header);
        }

        //load the models (only VTK and OBJ are supported for now)

        var vtkStructures = atlasStructure.Structure.filter(item => {
            if (Array.isArray(item.sourceSelector)) {
                return item.sourceSelector.some(selector => /\.vtk$/.test(selector.dataSource.source));
            }
            else {
                return /\.vtk$/.test(item.sourceSelector.dataSource.source);
            }
        });

        var objStructures = atlasStructure.Structure.filter(item => {
            if (Array.isArray(item.sourceSelector)) {
                return item.sourceSelector.some(selector => /\.obj$/.test(selector.dataSource.source));
            }
            else {
                return /\.obj$/.test(item.sourceSelector.dataSource.source);
            }
        });

        var stlStructures = atlasStructure.Structure.filter(item => {
            if (Array.isArray(item.sourceSelector)) {
                return item.sourceSelector.some(selector => /\.stl$/.test(selector.dataSource.source));
            }
            else {
                return /\.stl$/.test(item.sourceSelector.dataSource.source);
            }
        });

        singleton.totalNumberOfModels = vtkStructures.length + objStructures.length;


        for (i = 0; i<vtkStructures.length; i++) {
            loadVTKModel(vtkStructures[i]);
        }

        for (i = 0; i < objStructures.length; i++) {
            loadOBJModel(objStructures[i]);
        }

        for (i = 0; i < stlStructures.length; i++) {
            loadSTLModel(stlStructures[i]);
        }

        //load labelmap and background

        var nrrdDatasource = atlasStructure.DataSource.filter(datasource => /\.nrrd$/.test(datasource.source));
        singleton.totalNumberOfVolumes = nrrdDatasource.length;

        for (i = 0; i < nrrdDatasource.length; i++) {
            loadVolume(nrrdDatasource[i]);
        }

        mainApp.emit('loadingManager.atlasStructureLoaded', atlasStructure);

        //add this event in case the json is loaded before angular compilation is finished
        angular.element(document).ready(function () {
            mainApp.emit('loadingManager.atlasStructureLoaded', atlasStructure);
        });

    }

    function loadAtlasStructure (location) {
        jQuery.ajax({
            dataType: "json",
            url: location,
            async: true,
            success: dealWithAtlasStructure
        });
        var absoluteURL = getAbsoluteURL(location);
        atlasStructurePath = absoluteURL;

        mainApp.emit('loadingManager.atlasStructureStart', absoluteURL);
    }

    function testIfLoadingIsFinished () {
        if (singleton.numberOfModelsLoaded === singleton.totalNumberOfModels && singleton.totalNumberOfVolumes === singleton.numberOfVolumesLoaded) {

            //need to call forced update in case there has been no volume loaded
            mainApp.emit('ui.layout.forcedUpdate');

            //signal that the loading has ended
            mainApp.emit('loadingManager.loadingEnd');

            //if no volume loaded, hide the left panel
            if (singleton.totalNumberOfVolumes === 0) {
                mainApp.emit('ui.layout.hideLeftSide');
            }
        }
    }

    function isLoading() {
        return singleton.numberOfModelsLoaded !== singleton.totalNumberOfModels || singleton.totalNumberOfVolumes !== singleton.numberOfVolumesLoaded;
    }

    function getAbsoluteURL (url) {
        var a = document.createElement('a');
        a.href = url;
        return a.href;
    }

    singleton.loadVolume = loadVolume;
    singleton.loadVTKModel = loadVTKModel;
    singleton.loadAtlasStructure = loadAtlasStructure;
    singleton.volumesLoaded = volumesLoaded;
    singleton.volumesProgress = volumesProgress;
    singleton.modelsLoaded = modelsLoaded;
    singleton.isLoading = isLoading;
    singleton.getAbsoluteURL = getAbsoluteURL;


    Object.defineProperty(singleton, 'numberOfVolumesLoaded', {
        get : function () {
            return Object.keys(volumesLoaded).length;
        },
        set : function () {}
    });

    //methods accessible from outside by injecting volumesManager
    this.$get = function () {
        return singleton;
    };
}]);
