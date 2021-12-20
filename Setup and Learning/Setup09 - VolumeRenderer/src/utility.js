/**
 * @returns {{sliceThickness: *[], filename: string, dimensions: *[]}}
 */
export function textParse(text) {
    let datFile = {
        filename: '',
        dimensions: [],
        sliceThickness: []
    };
    console.log("out:",text)
    let lines = text.split('\n');
    lines.forEach(function(line) {
        let content = line.split(':');
        if (content.length > 1) {
            if (content[0] == 'ObjectFileName') {
                datFile.filename = content[1].trim();
            }
            else if (content[0] == 'Resolution') {
                let tmpDim = content[1].trim().split(' ');
                datFile.dimensions.push(tmpDim[0].trim(),tmpDim[1].trim(),tmpDim[2].trim());
            }
            else if (content[0] == 'SliceThickness') {
                let tmpSlice = content[1].trim().split(' ');
                datFile.sliceThickness.push(tmpSlice[0].trim(),tmpSlice[1].trim(),tmpSlice[2].trim());
            }
        }
    });
    return datFile
}


export function clean(scene) {
    //modified from threejs example https://github.com/mrdoob/three.js/blob/master/examples/webgl_instancing_performance.html

    const meshes = [];
    const groups = [];

    scene.traverse( function ( object ) {
        if ( object.isMesh || object.isLine) meshes.push( object );
        if ( object.isGroup ){
            object.traverse( function ( group_obj ){
                if ( group_obj.isMesh || object.isLine) meshes.push( group_obj );
            });
            groups.push(object);
        }
    } );

    meshes.forEach(element => {
        element.material.dispose();
        element.geometry.dispose();
        scene.remove( element );
    });

    groups.forEach(element => {
        scene.remove(element)
    });
}

