package utils

import (
	"context"
	"fmt"
	"os"

	// corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"
	// "k8s.io/apimachinery/pkg/util/errors"
)

func GetAllNodeConfig() {
	// 加载 kubeconfig
	kubeconfig := os.Getenv("KUBECONFIG")
	config, err := clientcmd.BuildConfigFromFlags("", kubeconfig)
	if err != nil {
		panic(err.Error())
	}

	// 创建客户端
	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		panic(err.Error())
	}

	// 获取所有节点
	nodes, err := clientset.CoreV1().Nodes().List(context.Background(), metav1.ListOptions{})
	if err != nil {
		panic(err.Error())
	}

	// 输出节点的设备信息
	for _, node := range nodes.Items {
		fmt.Printf("Node Name: %s\n", node.Name)
		for _, condition := range node.Status.Conditions {
			fmt.Printf("Condition Type: %s, Status: %s\n", condition.Type, condition.Status)
		}
		fmt.Printf("Node's Allocatable Resources: %v\n", node.Status.Allocatable)
		fmt.Println("-------------------------------")
	}
}
