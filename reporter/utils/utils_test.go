package utils

import (
	"fmt"
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestGetPayload(t *testing.T) {
	payload := GetReportDataPaylod(5, false)

	fmt.Println("{}", payload)
}

func TestGetDockerStat(t *testing.T) {
	dockerPayloads, err := GetDockerStat()
	assert.NoError(t, err, "Should can get docker stat")

	fmt.Println("{}", dockerPayloads)
}
