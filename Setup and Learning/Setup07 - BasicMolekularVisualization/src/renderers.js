import {vanDerWaal_radii, atom_colors} from "./constants";
import {color_wrapper, calculate_connections_elements} from "./utility";
import * as THREE from 'three';

/********************************
* ATOM AND CONNECTION RENDERING *
*********************************/

// ATOMS
// TODO: function -> render atoms as spheres
export function atoms_as_spheres(scene,atom_data) {
    for (const atomDataKey in atom_data.atom_list) {
        let elem = atom_data.atom_list[atomDataKey].elem;
        let pos = atom_data.atom_list[atomDataKey].pos_vector;

        const geometry = new THREE.SphereGeometry(vanDerWaal_radii[elem] * 0.25, 8, 8);
        const material = new THREE.MeshStandardMaterial({color: atom_colors[elem]});
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(pos.x,pos.y,pos.z);
        scene.add(sphere);
    }
}

// CONNECTIONS
// TODO: function -> render connections as lines
export function connections_as_lines(scene,atom_data) {
    const material = new THREE.LineBasicMaterial({color: 0x000000});

    for (const connectionListKey in atom_data.connection_list) {
        const points = [];
        let connection = atom_data.connection_list[connectionListKey];
        points.push(atom_data.atom_list[connection[0]].pos_vector);
        points.push(atom_data.atom_list[connection[1]].pos_vector);

        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        const line = new THREE.Line(geometry, material);
        scene.add(line);
    }
}

// TODO: function -> render connections as cylinders
export function connections_as_cylinders(scene,atom_data) {
    const material = new THREE.MeshStandardMaterial({color: 0xf0f0f0});

    let cylinder_data = calculate_connections_elements(atom_data)

    for (const connectionListKey in atom_data.connection_list) {
        let curr_cylinder = cylinder_data[connectionListKey];
        const geometry = new THREE.CylinderGeometry(
            curr_cylinder.radiusTop + 0,
            curr_cylinder.radiusBottom + 0,
            curr_cylinder.height + 0,
            8,
            1,
            true
        );

        const cylinder = new THREE.Mesh(geometry, material);
        let axis = new THREE.Vector3(0,1,0);
        cylinder.translateOnAxis(axis,curr_cylinder.height/2.0);

        cylinder.quaternion.setFromUnitVectors(
            axis,
            curr_cylinder.connectionVector.clone().normalize()
        );
        cylinder.position.copy(curr_cylinder.position); // curr_cylinder.connectionVector.clone().multiplyScalar(0.5));

        scene.add(cylinder);
    }
}
