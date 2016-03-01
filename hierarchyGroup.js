function HierarchyGroup () {
    this.children =[];
    this.hierarchyParents = [];
    
    Object.defineProperty(this, "visible",{
        get : function () {
            return this.children.some(x=>x.visible);
        },
        set : function (value) {
            this.children.forEach(x => x.visible = value);
        }
    });
}



HierarchyGroup.prototype = {

	constructor: HierarchyGroup,
    
    add : function (object) {
        
        if ( arguments.length > 1 ) {

			for ( var i = 0; i < arguments.length; i ++ ) {

				this.add( arguments[ i ] );

			}

			return this;

		}

		if ( object === this ) {

			console.error( "HierarchyGroup : object can't be added as a child of itself.", object );
			return this;

		}

		if ( object instanceof THREE.Object3D || object instanceof HierarchyGroup ) {
            
            //add object only if it has not already been added
			if ( this.children.indexOf(object) === -1 ) {

				this.children.push(object);
                
                if (!object.hierarchyParents) {
                    
                    object.hierarchyParents = [];
                    
                }
                
                object.hierarchyParents.push(this);

			}

		} else {

			console.error( "THREE.Object3D.add: object not an instance of THREE.Object3D or HierarchyGroup.", object );

		}

		return this;

    },
    
    remove : function (object) {
        
        if ( arguments.length > 1 ) {

			for ( var i = 0; i < arguments.length; i ++ ) {

				this.remove( arguments[ i ] );

			}

			return this;

		}

        if (this.children.indexOf(object) > -1) {
            
            this.children = this.children.filter(x => x !== object);
            var parentToRemove = this;
            object.hierarchyParents = object.hierarchyParents.filter(x => x !== parentToRemove);
            
        }

		return this;
    }
};
