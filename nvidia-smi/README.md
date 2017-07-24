#### VBIOS Version
Query the VBIOS version of each device:
```
$ nvidia-smi --query-gpu=gpu_name,gpu_bus_id,vbios_version --format=csv
```

name, pci.bus_id, vbios_version

GRID K2, 0000:87:00.0, 80.04.D4.00.07

GRID K2, 0000:88:00.0, 80.04.D4.00.08
 
| Query | Description |
| - | - |
| timestamp|The timestamp of where the query was made in format "YYYY/MM/DD HH:MM:SS.msec". |
| gpu_name|The official product name of the GPU. This is an alphanumeric string. For all products.|
| gpu_bus_id|PCI bus id as "domain:bus:device.function", in hex.|
| vbios_version|The BIOS of the GPU board.|

#### Query GPU metrics for host-side logging
This query is good for monitoring the hypervisor-side GPU metrics. This query will work for both ESXi and XenServer

```
$ nvidia-smi --query-gpu=timestamp,name,pci.bus_id,driver_version,pstate,pcie.link.gen.max,pcie.link.gen.current,temperature.gpu,utilization.gpu,utilization.memory,memory.total,memory.free,memory.used --format=csv -l 5
```

When adding additional parameters to a query, ensure that no spaces are added between the queries options.