import * as THREE from "three";
import {search_bonds} from "./utility";

export function parse_pdb(init_func, atom_data){
    // store file path of html input field in file variable
    const file = document.getElementById('input').files[0];
    const reader = new FileReader();
    atom_data.atom_list = [];
    atom_data.connection_list = [];
    atom_data.tmpFactorMinMax = [Number.MAX_VALUE, Number.MIN_VALUE];
    reader.readAsText(file)

    reader.onload = function(progressEvent){
        // linewise file reading
        const lines = this.result.split('\n');
        let temp_factor_sum = 0;
        // iterating over all lines
        lines.forEach(line => {
            // search for PDB class identifier "ATOM"
            const pdb_class = line.substring(0, 7).trim();
            if ( pdb_class === "ATOM" || pdb_class === "HETATM"){
                const current_atom = {
                    // parse certain positions of ATOM lines (exactly defined through PDB format )
                    atom_num: parseFloat(line.substring(8, 11).trim()),
                    atom_name: line.substring(12, 16).trim(),
                    pos_vector: new THREE.Vector3(parseFloat(line.substring(30, 38).trim()),
                        parseFloat(line.substring(38, 46).trim()),
                        parseFloat(line.substring(46, 54).trim())),
                    elem: line.substring(76, 78).trim(),
                    temp_fact: parseFloat(line.substring(61,67).trim())
                };
                // sum up tempFactors to calculate the mean
                temp_factor_sum += current_atom.temp_fact;
                // calculate min,max of tempFactors
                atom_data.tmpFactorMinMax[0] = atom_data.tmpFactorMinMax[0] > current_atom.temp_fact ? current_atom.temp_fact : atom_data.tmpFactorMinMax[0];
                atom_data.tmpFactorMinMax[1] = atom_data.tmpFactorMinMax[1] < current_atom.temp_fact ? current_atom.temp_fact : atom_data.tmpFactorMinMax[1];
                atom_data.atom_list.push(current_atom)
            }
        });
        // calculate the mean of tempFactors
        atom_data.temp_factor_mean = temp_factor_sum /= atom_data.atom_list.length;
        atom_data.connection_list = search_bonds(atom_data.atom_list);
        init_func();
        console.log("atom_data",atom_data);
    };
}

