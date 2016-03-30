/**
 * This class has been made to merge several slices
 * @class
 * @see THREE.MultiVolumesSlice
 */
THREE.MultiVolumesSlice = function( ) {

    var self = this;
    function definePropertyAsFirstSlice (name) {
        Object.defineProperty( self, name, {
            get : function() {
                if (self.slices.length > 0) {
                    return this.slices[0][name];
                }
                return undefined;

            },
            set : function() {

            }
        } );
    }


    /**
     * @member {Array} slices Hold all the slices to merge
     */
    this.slices = [];

    this.opacities = [];

    /**
     * @member {Array} volumes Read only : Hold all the volumes associated to the slices
     */
    Object.defineProperty( this, 'volumes', {
        get : function() {
            return this.slices.map(slice => slice.volume);
        },
        set : function() {}
    } );

    /**
     * @member {Number} index index of all the slice (should be consistent)
     */
    Object.defineProperty( this, 'index', {
        get : function() {

            if (this.slices.length > 0) {
                return this.slices[0].index;
            }
            return undefined;

        },
        set : function( value ) {

            value = Number(value);
            if (!isNaN(value)) {
                this.slices.forEach(slice => slice.index = value);
                this.geometryNeedsUpdate = true;
            }
            return value;

        }
    } );
    /**
	 * @member {String} axis The normal axis
     */
    definePropertyAsFirstSlice('axis');


    /**
     * @member {Object} listeners store all the listeners to the events of this slice
     */
    this.listeners = {
        repaint : [],
        addSlice : [],
        removeSlice : []
    };

    /**
	 * @member {HTMLCanvasElement} canvas The final canvas used for the texture
	 */
    /**
	 * @member {CanvasRenderingContext2D} ctx Context of the canvas
	 */
    this.canvas = document.createElement( 'canvas' );


    var canvasMap = new THREE.Texture( this.canvas );
    canvasMap.minFilter = THREE.LinearFilter;
    canvasMap.wrapS = canvasMap.wrapT = THREE.ClampToEdgeWrapping;
    var material = new THREE.MeshBasicMaterial( { map: canvasMap, side: THREE.DoubleSide, transparent : true } );
    /**
     * @member {THREE.Mesh} mesh The mesh ready to get used in the scene
     */
    this.mesh = new THREE.Mesh( this.geometry, material );
    this.mesh.renderOrder = 0;
    /**
     * @member {Boolean} geometryNeedsUpdate If set to true, updateGeometry will be triggered at the next repaint
     */
    this.geometryNeedsUpdate = true;

    /**
     * @member {Number} iLength Width of slice in the original coordinate system, corresponds to the width of the buffer canvas
     */
    definePropertyAsFirstSlice('iLength');

    /**
     * @member {Number} jLength Height of slice in the original coordinate system, corresponds to the height of the buffer canvas
     */

    definePropertyAsFirstSlice('jLength');

    definePropertyAsFirstSlice('matrix');
    definePropertyAsFirstSlice('maxIndex');



};

THREE.MultiVolumesSlice.prototype = {

    constructor : THREE.MultiVolumesSlice,

    /**
     * @member {Function} repaint Refresh the texture and the geometry if geometryNeedsUpdate is set to true
     * @param {Boolean} repaintAll Introduced to avoid unnecesary redraw of every sub slice. If not specified, sub slices will not be repainted.
     * @memberof THREE.MultiVolumesSlice
     */
    repaint : function(repaintAll) {

        repaintAll = repaintAll || false;
        if (repaintAll) {
            var multiSlice = this;
            this.slices.forEach(function (slice,i) {
                if (multiSlice.opacities[i]>0) {
                    slice.repaint();
                }
            });
        }

        if ( this.geometryNeedsUpdate ) {

            this.slices[0].updateGeometry();
            this.updateGeometry();

        }

        var i,
            slice,
            ctx = this.ctx;

        for (i = 0; i < this.slices.length; i++) {
            slice = this.slices[i];
            if (this.opacities[i]>0) {
                ctx.globalAlpha = this.opacities[i];
                ctx.drawImage(slice.canvas,0,0);
            }

        }

        this.mesh.material.map.needsUpdate = true;

        this.listeners.repaint.map( listener => listener.callback.call(listener.context));

    },

    /**
     * @member {Function} updateGeometry Refresh the geometry according to axis and index
     * @see THREE.Volume.extractPerpendicularPlane
     * @memberof THREE.MultiVolumesSlice
     */
    updateGeometry : function() {

        if (this.slices.length > 0) {

            var mainSlice = this.slices[0];

            this.canvas.width = mainSlice.canvas.width;
            this.canvas.height = mainSlice.canvas.height;
            this.ctx = this.canvas.getContext( '2d' );

            this.geometry = mainSlice.geometry;

            if ( this.mesh ) {

                this.mesh.geometry = this.geometry;
                //reset mesh matrix
                this.mesh.matrix = ( new THREE.Matrix4() ).identity();
                this.mesh.applyMatrix( this.matrix );

            }

            this.geometryNeedsUpdate = false;
        }

    },

    /**
     * @member {Function} onRepaint add a listener to the list of listeners
     * @param {Object} context
     * @param {Function} listener
     * @memberof THREE.MultiVolumesSlice
     */
    onRepaint : function (context, callback) {

        this.listeners.repaint.push({callback : callback, context : context});

    },

    /**
     * @member {Function} onAddSlice add a listener to the list of listeners
     * @param {Object} context
     * @param {Function} listener
     * @memberof THREE.MultiVolumesSlice
     */
    onAddSlice : function (context, callback) {

        this.listeners.addSlice.push({callback : callback, context : context});

    },

    /**
     * @member {Function} onRemoveSlice add a listener to the list of listeners
     * @param {Object} context
     * @param {Function} listener
     * @memberof THREE.MultiVolumesSlice
     */
    onRemoveSlice : function (context, callback) {

        this.listeners.removeSlice.push({callback : callback, context : context});

    },

    /**
     * @member {Function} addSlice add a slice to the list of slices to merge
     * @param {THREE.VolumeSlice} slice           The slice to add
     * @param {Number}            opacity         The opacity associated to this layer. Default is 1.
     * @param {Boolean} insertInBackground If true the slice will be the new background
     * @memberof THREE.MultiVolumesSlice
     */
    addSlice : function (slice, opacity, insertInBackground) {

        if (!this.slices.includes(slice)) {
            opacity = opacity === undefined ? 1 : opacity;
            insertInBackground = insertInBackground || false;

            if (insertInBackground) {
                this.slices.unshift(slice);
                this.opacities.unshift(opacity);
            }
            else {
                this.slices.push(slice);
                this.opacities.push(opacity);
            }

            this.listeners.addSlice.map( listener => listener.callback.call(listener.context, slice));
        }
    },

    /**
     * @member {Function} removeSlice remove a slice from the list of slices to merge
     * @param {THREE.VolumeSlice} slice           The slice to remove
     * @memberof THREE.MultiVolumesSlice
     */
    removeSlice : function (slice) {

        var index = this.slices.indexOf(slice);
        if (index > -1) {
            this.slices.splice(index,1);
            this.opacities.splice(index,1);

            this.listeners.removeSlice.map( listener => listener.callback.call(listener.context, slice));
        }

    },

    /**
     * @member {Function} setOpacity change the opacity of the given slice
     * @param {THREE.VolumeSlice} slice   The slice to remove
     * @param {Number} opacity  new value
     * @memberof THREE.MultiVolumesSlice
     */
    setOpacity : function (slice, opacity) {

        var index;
        if (slice instanceof THREE.VolumeSlice) {
            index = this.slices.indexOf(slice);
            if (index > -1) {
                this.opacities[index] = opacity;
            }
        }
        else if (slice instanceof THREE.Volume) {
            index = this.volumes.indexOf(slice);
            if (index > -1) {
                this.opacities[index] = opacity;
            }
        }

    },

    /**
     * @member {Function} setOpacity change the opacity of the given slice
     * @param {THREE.VolumeSlice} slice   The slice to remove
     * @param {Number} opacity  new value
     * @memberof THREE.MultiVolumesSlice
     */
    getOpacity : function (slice) {
        var index;
        if (slice instanceof THREE.VolumeSlice) {
            index = this.slices.indexOf(slice);
            if (index > -1) {
                return this.opacities[index];
            }
        }
        else if (slice instanceof THREE.Volume) {
            index = this.volumes.indexOf(slice);
            if (index > -1) {
                return this.opacities[index];
            }
        }
        return undefined;

    }

};
