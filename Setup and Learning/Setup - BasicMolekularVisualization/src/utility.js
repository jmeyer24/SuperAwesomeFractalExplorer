import * as THREE from 'three'
import {vanDerWaal_radii} from "./constants"


// remove all meshes, lines, geometries and materials from the actual scene
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

export function search_bonds(atom_list){
   // see pdb_parser.js for structure/content of atom_list
   // TODO: find covalent bonds
    let bonds = [];
    for (let i = 0; i < atom_list.length; i++) {
        let rad1 = vanDerWaal_radii[atom_list[i].elem];
        let pos1 = atom_list[i].pos_vector;

        for (let j = i+1; j < atom_list.length; j++) {
            let rad2 = vanDerWaal_radii[atom_list[j].elem];
            let pos2 = atom_list[j].pos_vector;
            if (pos1.distanceTo(pos2) < 0.6 * (rad1 + rad2)) {
                // this is a covalent bond!
                bonds.push([i,j]);
            }
        }
    }
    return bonds;
}

export function calculate_connections_elements(atom_data) {
   // TODO: calculate further necessary cylinder parameters
    let cylinder_data = [];

    for (const connectionListKey in atom_data.connection_list) {
        let connection = atom_data.connection_list[connectionListKey];
        let rad1 = vanDerWaal_radii[atom_data.atom_list[connection[0]].elem];
        let rad2 = vanDerWaal_radii[atom_data.atom_list[connection[1]].elem];
        let pos1 = atom_data.atom_list[connection[0]].pos_vector;
        let pos2 = atom_data.atom_list[connection[1]].pos_vector;

        let vec = new THREE.Vector3();
        vec.subVectors(pos1,pos2);
        let pos = new THREE.Vector3();
        pos.addVectors(pos1,pos2).multiplyScalar(0.5);

        const current_cylinder = {
            radiusTop: rad1 * 0.25 * 0.25,
            radiusBottom: rad2 * 0.25 * 0.25,
            height: pos1.distanceTo(pos2),
            connectionVector: vec,
            position: pos
        }
        cylinder_data.push(current_cylinder);
    }

    return cylinder_data;
}


export function tmpFactor_coloring(tmpFactor, atom_data) {
   // TODO BONUS: perform temperature factor based coloring
   // TODO BONUS: use a diverging color scale (blue to white to red)
    let minmax = atom_data.tmpFactorMinMax;
    let color_scale = d3.scale.linear()
        .domain([minmax[0], atom_data.temp_factor_mean ,minmax[1]])
        .range(["#0000ff", "#ffffff", "#ff0000"]);
}
