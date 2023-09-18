package main

import (
    "fmt"
    "flag"
    "net/url"
    "log"

    socketio "github.com/googollee/go-socket.io"
)

var (
	URL   = flag.String("url", "", "The http url of tianji, for example: https://tianji.msgbyte.com")
	WORKSPACE_ID   = flag.String("workspace", "", "The workspace id for tianji, this should be a uuid")
	INTERVAL = flag.Float64("interval", 2.0, "Input the INTERVAL")
	isVnstat = flag.Bool("vnstat", false, "Use vnstat for traffic statistics, linux only")
)

func main() {
	flag.Parse()

	parsedURL, err := url.Parse(*URL)

	if err != nil {
		log.Fatal("Invalid URL:", err)
	}

	if parsedURL.Scheme == "" {
		log.Fatal("Invalid URL: Missing scheme")
	}

	if *WORKSPACE_ID == "" {
		log.Fatal("WORKSPACE_ID must not be blank!")
	}

	client, _ := socketio.NewClient(*URL, nil)

	client.Connect()
	client.Emit("notice", "hello")

	fmt.Println("Hello, World!", *URL)
}
