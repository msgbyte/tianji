package utils

import (
	"fmt"
	jsoniter "github.com/json-iterator/go"
	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/load"
	"github.com/shirou/gopsutil/v3/mem"
	pNet "github.com/shirou/gopsutil/v3/net"
	"log"
	"math"
	"net"
	"os/exec"
	"runtime"
	"strconv"
	"strings"
	"time"
	"unsafe"
)

type ReportDataPayload struct {
	Uptime      uint64          `json:"uptime"`
	Load        jsoniter.Number `json:"load"`
	MemoryTotal uint64          `json:"memory_total"`
	MemoryUsed  uint64          `json:"memory_used"`
	SwapTotal   uint64          `json:"swap_total"`
	SwapUsed    uint64          `json:"swap_used"`
	HddTotal    uint64          `json:"hdd_total"`
	HddUsed     uint64          `json:"hdd_used"`
	CPU         jsoniter.Number `json:"cpu"`
	NetworkTx   uint64          `json:"network_tx"`
	NetworkRx   uint64          `json:"network_rx"`
	NetworkIn   uint64          `json:"network_in"`
	NetworkOut  uint64          `json:"network_out"`
}

var checkIP int

func GetReportDataPaylod(interval int, isVnstat bool) ReportDataPayload {
	payload := ReportDataPayload{}

	var netIn, netOut, netRx, netTx uint64
	if !isVnstat {
		netIn, netOut, netRx, netTx = getTraffic(interval)
	} else {
		_, _, netRx, netTx = getTraffic(interval)
		var err error
		netIn, netOut, err = getTrafficVnstat()
		if err != nil {
			log.Println("Please check if the installation of vnStat is correct")
		}
	}

	memoryTotal, memoryUsed, swapTotal, swapUsed := getMemory()
	hddTotal, hddUsed := getDisk(interval)
	payload.CPU = jsoniter.Number(fmt.Sprintf("%.1f", getCpu(interval)))
	payload.Load = jsoniter.Number(fmt.Sprintf("%.2f", getLoad()))
	payload.Uptime = getUptime()
	payload.MemoryTotal = memoryTotal
	payload.MemoryUsed = memoryUsed
	payload.SwapTotal = swapTotal
	payload.SwapUsed = swapUsed
	payload.HddTotal = hddTotal
	payload.HddUsed = hddUsed
	payload.NetworkRx = netRx
	payload.NetworkTx = netTx
	payload.NetworkIn = netIn
	payload.NetworkOut = netOut

	return payload
}

/**
 * Fork from https://github.com/cokemine/ServerStatus-goclient/blob/master/pkg/status/status.go
 */
func getMemory() (uint64, uint64, uint64, uint64) {
	memory, _ := mem.VirtualMemory()

	if runtime.GOOS == "linux" {
		return memory.Total / 1024.0, memory.Used / 1024.0, memory.SwapTotal / 1024.0, (memory.SwapTotal - memory.SwapFree) / 1024.0
	} else {
		swap, _ := mem.SwapMemory()
		return memory.Total / 1024.0, memory.Used / 1024.0, swap.Total / 1024.0, swap.Used / 1024.0
	}
}

func getUptime() uint64 {
	bootTime, _ := host.BootTime()
	return uint64(time.Now().Unix()) - bootTime
}

func getLoad() float64 {
	theLoad, _ := load.Avg()
	return theLoad.Load1
}

var cachedFs = make(map[string]struct{})
var timer = 0

func getDisk(interval int) (uint64, uint64) {
	var (
		size, used uint64
	)
	if timer <= 0 {
		diskList, _ := disk.Partitions(false)
		devices := make(map[string]struct{})
		for _, d := range diskList {
			_, ok := devices[d.Device]
			if !ok && checkValidFs(d.Fstype) {
				cachedFs[d.Mountpoint] = struct{}{}
				devices[d.Device] = struct{}{}
			}
		}
		timer = 300
	}
	timer -= interval
	for k := range cachedFs {
		usage, err := disk.Usage(k)
		if err != nil {
			delete(cachedFs, k)
			continue
		}
		size += usage.Total / 1024.0 / 1024.0
		used += usage.Used / 1024.0 / 1024.0
	}
	return size, used
}

func getCpu(interval int) float64 {
	cpuInfo, _ := cpu.Percent(time.Duration(interval)*time.Second, false)
	return math.Round(cpuInfo[0]*10) / 10
}

func getNetwork(checkIP int) bool {
	var HOST string
	if checkIP == 4 {
		HOST = "8.8.8.8:53"
	} else if checkIP == 6 {
		HOST = "[2001:4860:4860::8888]:53"
	} else {
		return false
	}
	conn, err := net.DialTimeout("tcp", HOST, 2*time.Second)
	if err != nil {
		return false
	}
	if conn.Close() != nil {
		return false
	}
	return true
}

var prevNetIn uint64
var prevNetOut uint64

func getTraffic(interval int) (uint64, uint64, uint64, uint64) {
	var (
		netIn, netOut uint64
	)
	netInfo, _ := pNet.IOCounters(true)
	for _, v := range netInfo {
		if checkInterface(v.Name) {
			netIn += v.BytesRecv
			netOut += v.BytesSent
		}
	}
	rx := uint64(float64(netIn-prevNetIn) / float64(interval))
	tx := uint64(float64(netOut-prevNetOut) / float64(interval))
	prevNetIn = netIn
	prevNetOut = netOut
	return netIn, netOut, rx, tx
}

func getTrafficVnstat() (uint64, uint64, error) {
	buf, err := exec.Command("vnstat", "--oneline", "b").Output()
	if err != nil {
		return 0, 0, err
	}
	vData := strings.Split(BytesToString(buf), ";")
	if len(vData) != 15 {
		// Not enough data available yet.
		return 0, 0, nil
	}
	netIn, err := strconv.ParseUint(vData[8], 10, 64)
	if err != nil {
		return 0, 0, err
	}
	netOut, err := strconv.ParseUint(vData[9], 10, 64)
	if err != nil {
		return 0, 0, err
	}
	return netIn, netOut, nil
}

var invalidInterface = []string{"lo", "tun", "kube", "docker", "vmbr", "br-", "vnet", "veth"}

func checkInterface(name string) bool {
	for _, v := range invalidInterface {
		if strings.Contains(name, v) {
			return false
		}
	}
	return true
}

var validFs = []string{"ext4", "ext3", "ext2", "reiserfs", "jfs", "btrfs", "fuseblk", "zfs", "simfs", "ntfs", "fat32", "exfat", "xfs", "apfs"}

func checkValidFs(name string) bool {
	for _, v := range validFs {
		if strings.ToLower(name) == v {
			return true
		}
	}
	return false
}

func BytesToString(b []byte) string {
	return *(*string)(unsafe.Pointer(&b))
}
