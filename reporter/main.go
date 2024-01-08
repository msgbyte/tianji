package main

import (
	"bytes"
	"flag"
	jsoniter "github.com/json-iterator/go"
	"log"
	"net"
	"net/http"
	"net/url"
	"os"
	"tianji-reporter/utils"
	"time"
)

type ReportData struct {
	WorkspaceId string                  `json:"workspaceId"`
	Name        string                  `json:"name"`
	Hostname    string                  `json:"hostname"`
	Timeout     int                     `json:"timeout"` // if service receive after timeout second, its means client are offline
	Payload     utils.ReportDataPayload `json:"payload"`
}

var (
	Mode        = flag.String("mode", "http", "The send mode of report data, you can select: 'http' or 'udp', default is 'http'")
	Url         = flag.String("url", "", "The http url of tianji, for example: https://tianji.msgbyte.com")
	WorkspaceId = flag.String("workspace", "", "The workspace id for tianji, this should be a uuid")
	Name        = flag.String("name", "", "The identification name for this machine")
	Interval    = flag.Int("interval", 5.0, "Input the INTERVAL, seconed")
	IsVnstat    = flag.Bool("vnstat", false, "Use vnstat for traffic statistics, linux only")
)

var version = "1.0.0"

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

	log.Println("Start reporting...")
	log.Println("Mode:", *Mode)
	log.Println("Version:", version)

	for {
		log.Println("Send report data to:", parsedURL.String())
		payload := ReportData{
			WorkspaceId: *WorkspaceId,
			Name:        name,
			Hostname:    hostname,
			Timeout:     interval * 2,
			Payload:     utils.GetReportDataPaylod(interval, *IsVnstat),
		}

		if *Mode == "udp" {
			sendUDPPack(*parsedURL, payload)
		} else {
			sendHTTPRequest(*parsedURL, payload)
		}

		<-ticker
	}
}

/**
 * Send UDP Pack to report server data
 */
func sendUDPPack(url url.URL, payload ReportData) {
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

/**
 * Send HTTP Request to report server data
 */
func sendHTTPRequest(_url url.URL, payload ReportData) {
	jsonData, err := jsoniter.Marshal(payload)
	if err != nil {
		log.Println("Error encoding JSON:", err)
		return
	}
	log.Printf("[Report] %s\n", jsonData)

	reportUrl, err := url.JoinPath(_url.String(), "/serverStatus/report")
	if err != nil {
		log.Println("Join url error:", err)
		return
	}

	req, err := http.NewRequest("POST", reportUrl, bytes.NewBuffer(jsonData))
	if err != nil {
		log.Println("Create request error:", err)
		return
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-tianji-report-version", version)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Println("Send request error:", err)
		return
	}

	defer resp.Body.Close()

	// Read response
	body := new(bytes.Buffer)
	_, err = body.ReadFrom(resp.Body)
	if err != nil {
		log.Println("Read response error:", err)
		return
	}

	log.Println("Response:", body)
}
