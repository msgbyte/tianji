package main

import (
	"flag"
	jsoniter "github.com/json-iterator/go"
	"log"
	"net"
	"net/url"
	"os"
	"tianji-reporter/utils"
	"time"
)

type ReportData struct {
	WorkspaceId string                  `json:"workspaceId"`
	Name        string                  `json:"name"`
	Hostname    string                  `json:"hostname"`
	Payload     utils.ReportDataPayload `json:"payload"`
}

var (
	Url         = flag.String("url", "", "The http url of tianji, for example: https://tianji.msgbyte.com")
	WorkspaceId = flag.String("workspace", "", "The workspace id for tianji, this should be a uuid")
	Name        = flag.String("name", "", "The identification name for this machine")
	Interval    = flag.Int("interval", 20.0, "Input the INTERVAL")
	IsVnstat    = flag.Bool("vnstat", false, "Use vnstat for traffic statistics, linux only")
)

func main() {
	flag.Parse()

	parsedURL, err := url.Parse(*Url)

	if err != nil {
		log.Fatal("Invalid URL:", err)
	}

	if parsedURL.Scheme == "" {
		log.Fatal("Invalid URL: Missing scheme")
	}

	if *WorkspaceId == "" {
		log.Fatal("WORKSPACE_ID must not be blank!")
	}

	hostname, _ := os.Hostname()
	var name string
	if *Name != "" {
		name = *Name
	} else {
		name = hostname
	}

	interval := *Interval

	ticker := time.Tick(time.Duration(interval) * time.Second)

	for {
		<-ticker
		log.Println("Send report data to:", parsedURL.String())
		sendUDPTestPack(*parsedURL, ReportData{
			WorkspaceId: *WorkspaceId,
			Name:        name,
			Hostname:    hostname,
			Payload:     utils.GetReportDataPaylod(interval, *IsVnstat),
		})
	}
}

func sendUDPTestPack(url url.URL, payload ReportData) {
	// parse target url
	addr, err := net.ResolveUDPAddr("udp", url.Hostname()+":"+url.Port())
	if err != nil {
		log.Println("Error resolving address:", err)
		return
	}

	// create UDP connection
	conn, err := net.DialUDP("udp", nil, addr)
	if err != nil {
		log.Println("Error creating connection:", err)
		return
	}
	defer conn.Close()

	// serialized message
	jsonData, err := jsoniter.Marshal(payload)
	log.Printf("[Report] %s\n", jsonData)
	if err != nil {
		log.Println("Error encoding JSON:", err)
		return
	}

	// Send message
	_, err = conn.Write(jsonData)
	if err != nil {
		log.Println("Error sending message:", err)
		return
	}

	log.Println("Message sent successfully!")
}
