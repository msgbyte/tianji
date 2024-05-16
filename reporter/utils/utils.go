package utils

import (
	"bytes"
	"context"
	"fmt"
	dockerTypes "github.com/docker/docker/api/types"
	dockerContainer "github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
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
	Uptime      uint64              `json:"uptime"`
	Load        jsoniter.Number     `json:"load"`
	MemoryTotal uint64              `json:"memory_total"`
	MemoryUsed  uint64              `json:"memory_used"`
	SwapTotal   uint64              `json:"swap_total"`
	SwapUsed    uint64              `json:"swap_used"`
	HddTotal    uint64              `json:"hdd_total"`
	HddUsed     uint64              `json:"hdd_used"`
	CPU         jsoniter.Number     `json:"cpu"`
	NetworkTx   uint64              `json:"network_tx"`
	NetworkRx   uint64              `json:"network_rx"`
	NetworkIn   uint64              `json:"network_in"`
	NetworkOut  uint64              `json:"network_out"`
	Docker      []DockerDataPayload `json:"docker,omitempty"`
}

type DockerDataPayload struct {
	ID               string             `json:"id"`
	Image            string             `json:"image"`
	ImageID          string             `json:"imageId"`
	Ports            []dockerTypes.Port `json:"ports"`
	CreatedAt        int64              `json:"createdAt"`
	State            string             `json:"state"`
	Status           string             `json:"status"`
	CpuPercent       float64            `json:"cpuPercent"`
	Memory           float64            `json:"memory"`
	MemLimit         uint64             `json:"memLimit"`
	MemPercent       float64            `json:"memPercent"`
	StorageWriteSize uint64             `json:"storageWriteSize"`
	StorageReadSize  uint64             `json:"storageReadSize"`
	NetworkRx        float64            `json:"networkRx"`
	NetworkTx        float64            `json:"networkTx"`
	IORead           uint64             `json:"ioRead"`
	IOWrite          uint64             `json:"ioWrite"`
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

	var dockerStat []DockerDataPayload
	dockerStat, _ = GetDockerStat()

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
	payload.Docker = dockerStat

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

func GetDockerStat() ([]DockerDataPayload, error) {
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())

	if err != nil {
		return nil, err
	}
	defer cli.Close()

	ctx := context.Background()

	containers, err := cli.ContainerList(context.Background(), dockerContainer.ListOptions{All: true})
	if err != nil {
		return nil, err
	}

	var dockerPayloads []DockerDataPayload

	for _, container := range containers {
		containerStats, err := cli.ContainerStats(ctx, container.ID, false)
		if err != nil {
			return nil, err
		}

		buf := new(bytes.Buffer)
		buf.ReadFrom(containerStats.Body)
		newStr := buf.String()

		v := dockerTypes.StatsJSON{}
		jsoniter.Unmarshal([]byte(newStr), &v)

		var cpuPercent float64
		var blkRead, blkWrite uint64
		var mem float64
		var memPercent float64
		if containerStats.OSType != "windows" {
			if v.MemoryStats.Limit != 0 {
				memPercent = float64(v.MemoryStats.Usage) / float64(v.MemoryStats.Limit) * 100.0
			}
			cpuPercent = calculateCPUPercentUnix(&v)
			blkRead, blkWrite = calculateBlockIO(v.BlkioStats)
			mem = float64(v.MemoryStats.Usage)
		} else {
			cpuPercent = calculateCPUPercentWindows(&v)
			blkRead = v.StorageStats.ReadSizeBytes
			blkWrite = v.StorageStats.WriteSizeBytes
			mem = float64(v.MemoryStats.PrivateWorkingSet)
		}

		netRx, netTx := calculateNetwork(v.Networks)

		dockerPayloads = append(dockerPayloads, DockerDataPayload{
			ID:               container.ID[:10],
			Image:            container.Image,
			ImageID:          container.ImageID,
			Ports:            container.Ports,
			CreatedAt:        container.Created,
			State:            container.State,
			Status:           container.Status,
			CpuPercent:       cpuPercent,
			Memory:           mem,
			MemLimit:         v.MemoryStats.Limit,
			MemPercent:       memPercent,
			StorageWriteSize: v.StorageStats.WriteSizeBytes,
			StorageReadSize:  v.StorageStats.ReadSizeBytes,
			NetworkRx:        netRx,
			NetworkTx:        netTx,
			IORead:           blkRead,
			IOWrite:          blkWrite,
		})

	}

	return dockerPayloads, nil
}

/**
 * Reference: https://github.com/moby/moby/blob/eb131c5383db8cac633919f82abad86c99bffbe5/cli/command/container/stats_helpers.go#L175
 */
func calculateCPUPercentUnix(v *dockerTypes.StatsJSON) float64 {
	previousCPU := v.PreCPUStats.CPUUsage.TotalUsage
	previousSystem := v.PreCPUStats.SystemUsage
	cpuPercent := 0.0
	// calculate the change for the cpu usage of the container in between readings
	cpuDelta := float64(v.CPUStats.CPUUsage.TotalUsage) - float64(previousCPU)
	// calculate the change for the entire system between readings
	systemDelta := float64(v.CPUStats.SystemUsage) - float64(previousSystem)

	if systemDelta > 0.0 && cpuDelta > 0.0 {
		cpuPercent = (cpuDelta / systemDelta) * float64(len(v.CPUStats.CPUUsage.PercpuUsage)) * 100.0
	}
	return cpuPercent
}

/**
 * Reference: https://github.com/moby/moby/blob/eb131c5383db8cac633919f82abad86c99bffbe5/cli/command/container/stats_helpers.go#L190
 */
func calculateCPUPercentWindows(v *dockerTypes.StatsJSON) float64 {
	// Max number of 100ns intervals between the previous time read and now
	possIntervals := uint64(v.Read.Sub(v.PreRead).Nanoseconds()) // Start with number of ns intervals
	possIntervals /= 100                                         // Convert to number of 100ns intervals
	possIntervals *= uint64(v.NumProcs)                          // Multiple by the number of processors

	// Intervals used
	intervalsUsed := v.CPUStats.CPUUsage.TotalUsage - v.PreCPUStats.CPUUsage.TotalUsage

	// Percentage avoiding divide-by-zero
	if possIntervals > 0 {
		return float64(intervalsUsed) / float64(possIntervals) * 100.0
	}
	return 0.00
}

/**
 * Reference: https://github.com/moby/moby/blob/eb131c5383db8cac633919f82abad86c99bffbe5/cli/command/container/stats_helpers.go#L206
 */
func calculateBlockIO(blkio dockerTypes.BlkioStats) (blkRead uint64, blkWrite uint64) {
	for _, bioEntry := range blkio.IoServiceBytesRecursive {
		switch strings.ToLower(bioEntry.Op) {
		case "read":
			blkRead = blkRead + bioEntry.Value
		case "write":
			blkWrite = blkWrite + bioEntry.Value
		}
	}
	return
}

/**
 * Reference: https://github.com/moby/moby/blob/eb131c5383db8cac633919f82abad86c99bffbe5/cli/command/container/stats_helpers.go#L218
 */
func calculateNetwork(network map[string]dockerTypes.NetworkStats) (float64, float64) {
	var rx, tx float64

	for _, v := range network {
		rx += float64(v.RxBytes)
		tx += float64(v.TxBytes)
	}
	return rx, tx
}
