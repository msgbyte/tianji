package utils

import (
	"fmt"
	"testing"
)

func TestGetAllNodeConfig(t *testing.T) {
	payload := GetAllNodeConfig()

	fmt.Println("{}", payload)
}
