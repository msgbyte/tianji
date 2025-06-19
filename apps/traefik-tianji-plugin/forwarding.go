package traefik_tianji_plugin

// Copied source from
// https://github.com/kzmake/traefik-plugin-forward-request/blob/master/util.go

import (
	"bytes"
	"io"
	"io/ioutil"
	"net"
	"net/http"
	"strings"
)

const (
	xForwardedProto  = "x-forwarded-proto"
	xForwardedFor    = "x-forwarded-for"
	xForwardedHost   = "x-forwarded-host"
	xForwardedPort   = "x-forwarded-port"
	xForwardedURI    = "x-forwarded-uri"
	xForwardedMethod = "x-forwarded-method"

	connection         = "connection"
	keepAlive          = "keep-alive"
	proxyAuthenticate  = "proxy-authenticate"
	proxyAuthorization = "proxy-authorization"
	te                 = "te" // canonicalized version of "TE"
	trailers           = "trailers"
	transferEncoding   = "transfer-Encoding"
	upgrade            = "upgrade"
)

var hopHeaders = []string{
	connection,
	keepAlive,
	proxyAuthenticate,
	proxyAuthorization,
	te, // canonicalized version of "TE"
	trailers,
	transferEncoding,
	upgrade,
}

func newForwardRequest(req *http.Request, forwardURL string) (*http.Request, error) {
	drainedBody, body, err := drainBody(req.Body)
	req.Body = body
	if err != nil {
		return nil, err
	}

	fReq, err := http.NewRequestWithContext(req.Context(), req.Method, forwardURL, drainedBody)
	if err != nil {
		return nil, err
	}

	copyHeaders(fReq.Header, req.Header)
	removeHeaders(fReq.Header, hopHeaders...)
	writeXForwardedHeaders(fReq.Header, req)

	return fReq, nil
}

func drainBody(b io.ReadCloser) (r1, r2 io.ReadCloser, err error) {
	if b == nil || b == http.NoBody {
		return http.NoBody, http.NoBody, nil
	}
	var buf bytes.Buffer
	if _, err = buf.ReadFrom(b); err != nil {
		return nil, b, err
	}
	if err := b.Close(); err != nil {
		return nil, b, err
	}

	return ioutil.NopCloser(&buf), ioutil.NopCloser(bytes.NewReader(buf.Bytes())), nil
}

func copyHeaders(dst, src http.Header) {
	for k, vv := range src {
		for _, v := range vv {
			dst.Add(k, v)
		}
	}
}

func removeHeaders(headers http.Header, names ...string) {
	for _, h := range names {
		headers.Del(h)
	}
}

func writeXForwardedHeaders(dst http.Header, req *http.Request) {
	if clientIP, _, err := net.SplitHostPort(req.RemoteAddr); err == nil {
		if values := req.Header.Values(xForwardedFor); len(values) > 0 {
			clientIP = strings.Join(values, ", ") + ", " + clientIP
		}
		dst.Set(xForwardedFor, clientIP)
	}

	xfm := req.Header.Get(xForwardedMethod)
	switch {
	case xfm != "":
		dst.Set(xForwardedMethod, xfm)
	case req.Method != "":
		dst.Set(xForwardedMethod, req.Method)
	default:
		dst.Del(xForwardedMethod)
	}

	xfp := req.Header.Get(xForwardedProto)
	switch {
	case xfp != "":
		dst.Set(xForwardedProto, xfp)
	case req.TLS != nil:
		dst.Set(xForwardedProto, "https")
	default:
		dst.Set(xForwardedProto, "http")
	}

	if xfp := req.Header.Get(xForwardedPort); xfp != "" {
		dst.Set(xForwardedPort, xfp)
	}

	xfh := req.Header.Get(xForwardedHost)
	switch {
	case xfh != "":
		dst.Set(xForwardedHost, xfh)
	case req.Host != "":
		dst.Set(xForwardedHost, req.Host)
	default:
		dst.Del(xForwardedHost)
	}

	xfu := req.Header.Get(xForwardedURI)
	switch {
	case xfu != "":
		dst.Set(xForwardedURI, xfu)
	case req.URL.RequestURI() != "":
		dst.Set(xForwardedURI, req.URL.RequestURI())
	default:
		dst.Del(xForwardedURI)
	}
}

func overrideHeaders(dst, src http.Header, overrideHeaders ...string) {
	removeHeaders(dst, overrideHeaders...)

	for _, overrideHeader := range overrideHeaders {
		values := src.Values(overrideHeader)
		for _, v := range values {
			dst.Add(overrideHeader, v)
		}
	}
}
