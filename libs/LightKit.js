/**
 * This class has been written to handle the implement LightKit with THREE.js
 * See the article "LightKit: A lighting system for effective visualization"
 * written by Michael Halle and Jeanette Meng (IEEE Visualization 2003)
 * @class
 * @author Valentin Demeusy / https://github.com/stity
 * @param   {THREE.Camera} camera The camera to which lightkit will be bound
 */
function LightKit ( camera, controls ) {

    this.camera = camera;
    this.controls = controls;

    this.warmth = {
        key : 0.6,
        fill : 0.4,
        head : 0.5,
        back1 : 0.5,
        back2 : 0.5
    };

    this.lights = {
        key : new THREE.DirectionalLight(0xffffff),
        fill : new THREE.DirectionalLight(0xffffff),
        back1 : new THREE.DirectionalLight(0xffffff),
        back2 : new THREE.DirectionalLight(0xffffff),
        head : new THREE.DirectionalLight(0xffffff)
    };



    this.intensity = 0.004;

    this.ratio = {
        key : 1,
        back1 : 3.5,
        back2 : 3.5,
        head : 3.5,
        fill : 4.5
    };

    this.longitude = {
        key : 10,
        fill : -10,
        head : 0,
        back1 : 110,
        back2 : -110
    };

    this.latitude = {
        key : 50,
        fill : -75,
        head : 0,
        back1 : 0,
        back2 : 0
    };

    this.update();

    for (var id in this.lights) {
        camera.add(this.lights[id]);
        camera.add(this.lights[id].target);
    }

}

LightKit.prototype = {

    constructor : LightKit,

    warmthTable : [
        0.1674, 0.3065, 1.0000, 0.5865,
        0.1798, 0.3204, 1.0000, 0.5965,
        0.1935, 0.3352, 1.0000, 0.6071,
        0.2083, 0.3511, 1.0000, 0.6184,
        0.2245, 0.3679, 1.0000, 0.6302,
        0.2422, 0.3859, 1.0000, 0.6426,
        0.2614, 0.4050, 1.0000, 0.6556,
        0.2822, 0.4252, 1.0000, 0.6693,
        0.3049, 0.4467, 1.0000, 0.6837,
        0.3293, 0.4695, 1.0000, 0.6986,
        0.3557, 0.4935, 1.0000, 0.7142,
        0.3841, 0.5188, 1.0000, 0.7303,
        0.4144, 0.5454, 1.0000, 0.7470,
        0.4468, 0.5731, 1.0000, 0.7642,
        0.4811, 0.6020, 1.0000, 0.7818,
        0.5173, 0.6320, 1.0000, 0.7998,
        0.5551, 0.6628, 1.0000, 0.8179,
        0.5943, 0.6942, 1.0000, 0.8362,
        0.6346, 0.7261, 1.0000, 0.8544,
        0.6756, 0.7581, 1.0000, 0.8724,
        0.7168, 0.7898, 1.0000, 0.8899,
        0.7575, 0.8209, 1.0000, 0.9068,
        0.7972, 0.8508, 1.0000, 0.9229,
        0.8351, 0.8791, 1.0000, 0.9379,
        0.8705, 0.9054, 1.0000, 0.9517,
        0.9026, 0.9290, 1.0000, 0.9640,
        0.9308, 0.9497, 1.0000, 0.9746,
        0.9546, 0.9671, 1.0000, 0.9834,
        0.9734, 0.9808, 1.0000, 0.9903,
        0.9872, 0.9907, 1.0000, 0.9954,
        0.9958, 0.9970, 1.0000, 0.9985,
        0.9996, 0.9997, 1.0000, 0.9999,
        1.0000, 0.9999, 0.9996, 0.9999,
        1.0000, 0.9988, 0.9958, 0.9994,
        1.0000, 0.9964, 0.9871, 0.9982,
        1.0000, 0.9925, 0.9730, 0.9962,
        1.0000, 0.9869, 0.9532, 0.9935,
        1.0000, 0.9796, 0.9275, 0.9898,
        1.0000, 0.9705, 0.8959, 0.9853,
        1.0000, 0.9595, 0.8584, 0.9798,
        1.0000, 0.9466, 0.8150, 0.9734,
        1.0000, 0.9317, 0.7660, 0.9660,
        1.0000, 0.9147, 0.7116, 0.9576,
        1.0000, 0.8956, 0.6522, 0.9482,
        1.0000, 0.8742, 0.5881, 0.9377,
        1.0000, 0.8506, 0.5199, 0.9261,
        1.0000, 0.8247, 0.4483, 0.9134,
        1.0000, 0.7964, 0.3739, 0.8995,
        1.0000, 0.7656, 0.2975, 0.8845,
        1.0000, 0.7324, 0.2201, 0.8683,
        1.0000, 0.6965, 0.1426, 0.8509,
        1.0000, 0.6580, 0.0662, 0.8323,
        1.0000, 0.6179, 0.0000, 0.8134,
        1.0000, 0.5832, 0.0000, 0.8008,
        1.0000, 0.5453, 0.0000, 0.7868,
        1.0000, 0.5042, 0.0000, 0.7713,
        1.0000, 0.4595, 0.0000, 0.7541,
        1.0000, 0.4111, 0.0000, 0.7350,
        1.0000, 0.3588, 0.0000, 0.7139,
        1.0000, 0.3025, 0.0000, 0.6904,
        1.0000, 0.2423, 0.0000, 0.6643,
        1.0000, 0.1782, 0.0000, 0.6353,
        1.0000, 0.1104, 0.0000, 0.6032,
        1.0000, 0.0396, 0.0000, 0.5677,
    ],

    /**
     * @member {Function} getColorFromWarmth Convert a warmth factor to a RGB color
     * @memberof LightKit
     * @param {number} x    warmth factor (between 0 and 1)
     * @returns {THREE.Color}  the color
     */
    getColorFromWarmth : function (x)  {
        var i = 63*x,
            inf = Math.floor(i),
            sup = Math.min(63,Math.ceil(i)),
            frac = i-inf,
            r = Math.round(255*((1-frac)*this.warmthTable[4*inf]+frac*this.warmthTable[4*sup])),
            g = Math.round(255*((1-frac)*this.warmthTable[4*inf+1]+frac*this.warmthTable[4*sup+1])),
            b = Math.round(255*((1-frac)*this.warmthTable[4*inf+2]+frac*this.warmthTable[4*sup+2]));

        return new THREE.Color(r,g,b);
    },

    /**
     * @member {Function} getIntensityRatioFromWarmth Convert a warmth factor to an intensity factor
     * @memberof LightKit
     * @param {number} x    warmth factor (between 0 and 1)
     * @returns {number}  the intensity factor
     */
    getIntensityRatioFromWarmth : function (x) {
        var i = 63*x,
            inf = Math.floor(i),
            sup = Math.min(63,Math.ceil(i)),
            frac = i-inf,
            int = (1-frac)*this.warmthTable[4*inf+3]+frac*this.warmthTable[4*sup+3];
        return 1/int;
    },

    updateColor : function () {
        var id,
            color;
        for (id in this.lights) {
            color = this.getColorFromWarmth(this.warmth[id]);
            this.lights[id].color = color;
        }
    },

    updateIntensity : function () {
        var id,
            intensityRatio;
        for (id in this.lights) {
            intensityRatio = this.getIntensityRatioFromWarmth(this.warmth[id]);
            this.lights[id].intensity = Math.min(1, this.intensity*intensityRatio/this.ratio[id]);
        }
    },

    updatePosition : function () {
        var origin = this.controls.target,
            position = this.camera.position,
            z = this.camera.up.clone().normalize(),
            x = position.clone().sub(origin).normalize(),
            y = z.clone().cross(x),
            r = position.clone().sub(origin).length,
            id,
            pi = Math.PI,
            pos,
            lat,
            long;

        for (id in this.lights) {
            pos = origin.clone();
            lat = pi*this.latitude[id]/180;
            long = pi*this.longitude[id]/180;
            pos.add(x.clone().multiplyScalar(Math.cos(lat)*Math.cos(long)));
            pos.add(y.clone().multiplyScalar(Math.cos(lat)*Math.sin(long)));
            pos.add(z.clone().multiplyScalar(Math.sin(lat)));
            pos.normalize();
            console.log(pos);
            this.lights[id].position.copy(pos);
        }


    },

    update : function () {
        this.updateColor();
        this.updateIntensity();
        this.updatePosition();
    }



};
