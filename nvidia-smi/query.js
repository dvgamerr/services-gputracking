const fs 			= require('fs')

module.exports = (q) => {
	q = q || ['pci.bus_id,name']
	let NVSMIx64 	= `C:/Program Files/NVIDIA Corporation/NVSMI/nvidia-smi.exe`;
	if (fs.existsSync(`${NVSMIx64}`)) { 
		return `"${NVSMIx64}" --query-gpu=${q.join(',')} --format=csv -l 1`
	} else {
		return ''
	}
}